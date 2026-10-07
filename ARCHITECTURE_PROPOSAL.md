# Nexova Solutions: Backend Architecture Proposal

**To:** Sergio Molina, CTO
**Scope:** Backend of the Nexova AI platform (FastAPI)
**Status:** Draft v1, for discussion before the next sprint
**Format:** Reasoning only, no code

---

## 1. Context: what are we building?

Nexova is a 120-person HR consulting and talent acquisition firm (Valencia and Miami). Its revenue comes from three lines: executive/mid-management headhunting, customer support outsourcing, and corporate training. Today its technology is a patchwork (HubSpot, a legacy Zendesk, a home-built ATS from the 2010s, Google Workspace, spreadsheets), with **no telemetry, no centralised logging and manual deployments**.

Across the previous milestones we identified needs in eight areas. The backend has to serve all of them:

| Area | Key backend needs |
|---|---|
| Talent Selection (core business) | CV scoring and explainable ranking, RAG over the candidate database, candidate portal with real-time status, automatic status emails |
| Corporate Training | Searchable catalogue, online enrolment, recommendations, learner progress, advisory chatbot |
| Customer Support | First-line RAG chatbot (target: 40% of queries resolved), knowledge base with semantic search, real-time dashboard, sentiment analysis (48h average resolution vs 24h SLA) |
| Sales | Pipeline dashboard, prospecting sequences, inactivity alerts, proposal-angle agent (HubSpot integration) |
| HR (internal) | HR portal, onboarding checklists, KPIs, policy Q&A agent |
| Marketing | Metrics dashboard (visits, sources, conversion), AI content pipeline |
| Technology | Central telemetry/logging, data pipeline feeding all dashboards, alerts, internal engineering agent |
| Executive | Unified real-time KPIs, automatic weekly report, threshold alerts, natural-language assistant |

Three characteristics of this system drive every decision below:

1. **Many business domains, one small team.** There are at least five very different user groups (consultants, sales, HR, training, support) plus executives, but the tech team is six people.
2. **AI is the product, not a bolt-on.** CV scoring, RAG and agents are central deliverables. They are slow, costly, non-deterministic and must be explainable.
3. **Integration-heavy and data-hungry.** The backend sits between old systems (ATS, Zendesk, HubSpot, Google Workspace) and new dashboards, so data flows in from many places and out to many views.

---

## 2. Recommended architectural pattern

### 2.1 Proposal: a layered architecture, organised by domain, deployed as a modular monolith

In plain terms: **one FastAPI application** (one deployable unit), split internally into **business domains** (selection, training, support, sales, hr...), and inside each domain a **layered structure** with clear responsibilities:

```
HTTP request → Router (API layer) → Service (business logic) → Repository (data access) → Database
                                         ↓
                              AI module / Integrations (external systems)
```

- **Router layer:** receives HTTP requests, validates input/output with schemas, calls a service. No business rules here.
- **Service layer:** the business logic ("what happens when a candidate is scored", "what counts as an inactive deal"). The only layer that coordinates repositories, AI components and integrations.
- **Repository / data layer:** the only place that talks to the database.
- **Models and schemas:** database models (storage shape) are kept separate from API schemas (contract shape).

### 2.2 Why this fits Nexova (and not a generic preference)

- **The domains are already given by the business.** Nexova's departments (selection, training, support, sales, HR, marketing, executive) map naturally to code modules. Organising by domain means Javier's selection needs live in one place and don't tangle with Elena's training catalogue.
- **A six-person team cannot operate many services.** A monolith means one repository, one deployment, one log stream, one database to back up. Nexova currently has *no* telemetry and manual deployments; adding the operational burden of several independently deployed services before we have basic observability would be a mistake.
- **The layering protects the AI components.** CV scoring needs to be explainable and testable. By keeping AI logic in services and a dedicated AI module (not inside route functions), we can test scoring rules, swap the model provider, and log every score with its reasons.
- **The modular boundaries keep the door open.** If the support chatbot later needs to scale on its own (SLA-critical, high traffic), a well-bounded `support` domain can be extracted into its own service with far less pain than untangling a single big file.

### 2.3 Alternatives considered

| Option | Why not (for now) |
|---|---|
| **Classic MVC** | MVC assumes the server renders the views. Our frontend is a separate system that consumes an API, so there is no "View" on the backend; the router/schema layer replaces it. We keep MVC's *separation-of-concerns idea*, not its structure. |
| **Microservices** | Would multiply deployments, networking, logging and auth problems for a team that has no centralised logging today. Premature. Revisit when a specific domain has distinct scaling needs. |
| **Serverless (functions)** | Good for isolated, event-driven tasks (for example a nightly report), but a poor fit for the whole system: many shared models, DB connection management, long AI calls and cold starts hurt chatbots that must respect SLAs. It may complement the monolith for scheduled jobs later. |
| **One flat app (everything in `main.py`)** | Fast to start, but exactly the "patchwork" problem Nexova already has, now in code. |

---

## 3. Research: how FastAPI projects are typically structured

**Source consulted:** FastAPI official documentation, *"Bigger Applications - Multiple Files"* (https://fastapi.tiangolo.com/tutorial/bigger-applications/).

What the research established, and how it shapes this proposal:

| Convention found | How we apply it |
|---|---|
| Large apps are split across several files and packages, with an `__init__.py` in each directory/subdirectory. The docs present this as the equivalent of Flask's Blueprints. | Every folder in our tree is a Python package. |
| `APIRouter` is described as a "mini FastAPI" class. A router holds the path operations of one module and is then included in the main `FastAPI` app. | **One router per domain.** `main.py` only creates the app, registers middleware, and includes routers. |
| Dependencies can be attached to an `APIRouter`, for example to require authentication for a whole group of path operations. | Authentication/role checks are declared per router (or per domain), not repeated per endpoint. |
| The docs' example layout uses `app/main.py`, `app/routers/`, `app/dependencies.py` and an `internal/` package. | We keep `app/main.py` and a dedicated shared dependencies module. |

**Where we deliberately go beyond the tutorial (our own reasoning, not a docs claim):** the tutorial's example is small, so it groups files *by type* (`routers/`, models, ...). With eight business areas, grouping by type would scatter one business feature across many folders. We therefore group **by domain first**, and by layer *inside* each domain. The FastAPI convention (one `APIRouter` per module, included from `main.py`) is preserved either way, which is what keeps the structure recognisable to any FastAPI developer.

---

## 4. Proposed folder and module structure

The project lives in the transversal monorepo (our fork of the company monorepo):

```
nexova-monorepo/
├── backend/
│   ├── app/
│   │   ├── main.py                 # creates the app, middleware (CORS), includes routers
│   │   ├── core/                   # cross-cutting infrastructure
│   │   │   ├── config.py           # settings read from environment variables
│   │   │   ├── database.py         # DB engine/session setup
│   │   │   ├── security.py         # authentication, password/token helpers
│   │   │   ├── logging.py          # centralised structured logging
│   │   │   └── exceptions.py       # shared error types and handlers
│   │   ├── api/
│   │   │   ├── dependencies.py     # shared dependencies (current user, DB session, roles)
│   │   │   └── v1/router.py        # assembles all domain routers under /api/v1
│   │   ├── domains/                # one package per business domain
│   │   │   ├── auth/               # users, roles, login
│   │   │   ├── selection/          # vacancies, candidates, applications, scoring, status
│   │   │   ├── training/           # catalogue, enrolments, learners, recommendations
│   │   │   ├── support/            # tickets, knowledge base, chatbot, sentiment
│   │   │   ├── sales/              # prospects, deals, sequences, alerts
│   │   │   ├── hr/                 # employees, leave, onboarding, HR KPIs
│   │   │   ├── marketing/          # web metrics, content pipeline
│   │   │   └── executive/          # unified KPIs, weekly report, assistant
│   │   │       (each domain contains: router.py, schemas.py, models.py,
│   │   │        service.py, repository.py)
│   │   ├── ai/                     # shared AI capabilities (not tied to one domain)
│   │   │   ├── llm_client.py       # single entry point to the language model provider
│   │   │   ├── embeddings.py       # text → vectors
│   │   │   ├── retrieval.py        # semantic search / RAG building blocks
│   │   │   └── prompts/            # versioned prompt templates
│   │   ├── integrations/           # adapters to external systems
│   │   │   ├── hubspot.py
│   │   │   ├── zendesk.py
│   │   │   ├── legacy_ats.py
│   │   │   └── google_workspace.py
│   │   └── observability/          # health checks, metrics, alert hooks
│   ├── tests/                      # mirrors app/ structure
│   ├── .env.example                # documented variables, no real secrets
│   └── requirements.txt
├── frontend/                       # separate application (see section 6)
└── docs/
    └── ARCHITECTURE_PROPOSAL.md
```

### Criteria used to separate responsibilities

1. **Domain ownership.** Code that changes because one department's needs change lives together (`selection/` changes when Javier's team changes their process).
2. **Layer responsibility inside a domain.** Router = HTTP, service = business rules, repository = data, schemas = API contract, models = storage.
3. **Shared capability vs domain-specific.** AI building blocks (embeddings, retrieval, LLM client) are shared in `ai/`; what to *do* with them (scoring a CV, answering a support ticket) belongs to the domain's service.
4. **Isolate the outside world.** Every external system sits behind an adapter in `integrations/`. If HubSpot or the legacy ATS changes, only one file changes. This matters because the legacy ATS is the most fragile piece in the estate.
5. **Dependency direction.** Domains may use `core/`, `ai/` and `integrations/`. `core/` never imports from domains. Domains do not reach into each other's repositories; if `executive` needs sales data, it calls the `sales` service.

---

## 5. Router and endpoint organisation

Each domain exposes one `APIRouter`, all mounted under a versioned prefix (`/api/v1`) and tagged by domain so the automatic interactive docs (OpenAPI) are grouped by department. Routes use plural nouns for resources and verbs only for actions that are not plain CRUD.

| Domain | Prefix | Example routes (no code, just the surface) |
|---|---|---|
| auth | `/api/v1/auth` | login, refresh session, current user, roles |
| selection | `/api/v1/selection` | vacancies (list/create/detail); candidates (list/create/detail); applications and their status; **candidate scoring** (request a score, view score with explanation); **candidate search** (natural-language query); candidate-facing **status** lookup |
| training | `/api/v1/training` | catalogue courses (list/search/detail); enrolments (create/list); learners and progress; recommendations for a client profile; training-plan advisor |
| support | `/api/v1/support` | tickets (list/create/detail/update); knowledge-base articles and semantic search; chatbot conversation; sentiment results; live queue/backlog metrics |
| sales | `/api/v1/sales` | prospects; deals and pipeline stages; outreach sequences; inactivity alerts; proposal-angle suggestion |
| hr | `/api/v1/hr` | employees; leave requests; onboarding checklists and progress; HR KPIs; policy Q&A |
| marketing | `/api/v1/marketing` | traffic and conversion metrics; content drafts and approval |
| executive | `/api/v1/executive` | unified KPI snapshot; weekly report (generate/fetch); threshold alerts; assistant question |
| observability | `/api/v1/system` | health check, readiness, version info |

Grouping principles:

- **A route belongs to the domain that owns the data**, not to the screen that displays it. The executive dashboard is a *consumer* of other domains' services, not a place to copy their logic.
- **Authorisation is declared at router level.** For instance, `hr` routes require an HR role, `executive` routes require an executive role, and candidate-facing status lookups use a limited external-candidate access.
- **Heavy AI operations are explicit actions** (for example, "request a score"), so the frontend can show progress and the backend can later move them to background processing without changing the contract.

---

## 6. Frontend and backend as separate systems

**Sources consulted:** FastAPI documentation on CORS (CORSMiddleware) and several practitioner guides on FastAPI + JavaScript frontends (for example the Sentry "Access-Control-Allow-Origin" answer and the Wristband FastAPI CORS guide).

### 6.1 Repository organisation: monorepo, two independent apps

We stay in the **single monorepo** with two top-level folders, `backend/` and `frontend/`, each with its own dependencies, tests and run command. Reasons: we already work in a monorepo, one pull request can change an endpoint and its screen together, and a six-person team benefits from one place to look. They are still **separate systems**: no code is imported across the boundary, and they deploy independently. The only shared thing is the **API contract**.

### 6.2 API as the contract

- The frontend talks to the backend only over HTTP/JSON.
- FastAPI generates an OpenAPI description automatically; this becomes the shared reference between teams. Changes to response shapes are communicated through it.
- All routes are versioned (`/api/v1`) so the backend can evolve without breaking the frontend or any other consumer (for example the candidate portal).

### 6.3 CORS

- Research finding: FastAPI does not enable CORS by default, so a browser frontend on one origin (for example `localhost:3000`) calling a backend on another (for example `localhost:8000`) will be blocked until the backend explicitly allows it.
- CORS is only needed when scheme, domain or port differ. If both were served from the same origin it would not be needed; we are choosing **separate origins** (separate deployments), so we need it.
- The fix is FastAPI's built-in `CORSMiddleware`, registered once in `main.py`.
- Guidance gathered: list **explicit origins** rather than a wildcard, especially once credentials (cookies/auth) are involved, and include only the real frontend domains per environment.
- Practitioner guides also warn that when the backend crashes with a 500 error, the browser may report a CORS error even though the real problem is the server error. The team must check backend logs before assuming a CORS misconfiguration.

### 6.4 Environment variables and configuration

- All environment-specific values come from environment variables read in a single `core/config.py`: database URL, secret keys, LLM provider keys, integration credentials (HubSpot, Zendesk), **list of allowed frontend origins**, and environment name.
- `.env` files are never committed; `.env.example` documents every variable with a safe placeholder.
- The **frontend** has its own, separate variables, mainly the backend base URL per environment. Anything in a frontend bundle is visible to users, so **no secrets ever go in frontend variables**; all provider keys stay in the backend.
- Local, staging and production each have their own values; the allowed-origins list is the main thing that must be updated when a new frontend URL appears.

### 6.5 Authentication across systems

Because the two apps are on different origins, authentication is token-based (or cookie-based with the CORS credentials settings aligned). The decision must be made once, early, because it affects both CORS configuration and frontend code. Proposed default: short-lived access tokens issued by `auth`, validated through a shared dependency.

---

## 7. Initial technical decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | FastAPI | Already the course framework; automatic validation and OpenAPI docs |
| Structure | Modular monolith, domain-first | Section 2 |
| API style | REST/JSON, versioned at `/api/v1` | Simple, matches what the frontend needs |
| Validation | Separate request/response schemas from DB models | Prevents leaking internal fields (for example candidate data) and lets the DB change without breaking the API |
| Config | Environment variables via one settings module | Section 6.4 |
| Logging | One structured logging setup in `core/logging.py`, request IDs on every request | Directly addresses Nexova's "we find out about failures through users" problem |
| AI access | Single `llm_client` and `retrieval` module; prompts versioned in `ai/prompts/` | Swap providers in one place, reproducible behaviour |
| AI explainability | Every score/recommendation stored with its inputs and reasons | CV rankings must be explainable to consultants and clients |
| External systems | Only through `integrations/` adapters | Isolates legacy ATS, HubSpot, Zendesk |
| Long-running AI work | Designed as explicit actions so they can become background jobs later | Avoids blocking requests; the contract does not change |
| Testing | `tests/` mirrors `app/`; services tested without HTTP | Business rules and scoring logic tested in isolation |
| Sensitive data | Candidate and employee data treated as personal data from the start; role-based access per router | HR and recruitment data is sensitive, and Nexova operates in Spain and the US |

---

## 8. Risks and points of attention

1. **Business logic leaking into routers.** If endpoints start containing scoring rules, SQL or integration calls, the layering is lost, logic gets duplicated between routes (for example the same "inactive deal" rule in the sales route and the executive dashboard), and nothing can be tested without HTTP. *Mitigation:* code review rule: routers only validate, call a service and return.

2. **Everything in `main.py` or one giant router file.** The most common failure with FastAPI projects. With eight domains, a single file becomes unmergeable for six developers working at once and hides ownership. *Mitigation:* one router per domain, `main.py` only assembles.

3. **Domains reaching into each other.** If `executive` reads `sales` tables directly, a change to the sales data model silently breaks the executive dashboard, and we recreate the disconnected-systems problem inside our own code. *Mitigation:* cross-domain access only through the owning domain's service.

4. **Coupling to the legacy ATS and other external systems.** If HubSpot, Zendesk or the legacy ATS are called from many places, any change on their side (or their downtime) spreads across the codebase. *Mitigation:* adapters in `integrations/`, with failures handled in one place.

5. **CORS and environment misconfiguration.** Wildcard origins "to make it work" become a security hole; missing origins in staging/production cause confusing browser errors; a backend 500 can look like a CORS problem. *Mitigation:* explicit origin list per environment, documented `.env.example`, check backend logs first.

6. **Secrets and configuration committed or exposed.** Keys for the LLM provider and integrations in the repo or in frontend variables would be a serious breach. *Mitigation:* secrets only in backend environment variables, never committed.

7. **Mixing database models and API schemas.** Returning DB models directly exposes internal or sensitive fields (candidate data, HR data) and makes every database change an API-breaking change. *Mitigation:* separate schemas per domain.

8. **AI logic scattered and unexplainable.** Prompts and model calls spread across routes make behaviour irreproducible and make CV rankings impossible to justify to a client. *Mitigation:* central `ai/` module, stored reasons for every score.

9. **Over-engineering too early.** Building all eight domains at once, or splitting into services prematurely, would stall a six-person team. *Mitigation:* start with `auth`, `selection` (core revenue) and `observability`, then add domains by priority. Keep the folders for the others empty or absent until needed.

10. **Unclear ownership of dashboards' data.** Executive and department dashboards need a data pipeline. Without agreeing early which domain owns which metric, numbers will disagree between dashboards. *Mitigation:* each KPI is defined and owned by one domain service; dashboards only read it.

---

## 9. Suggested next steps (for the team to confirm)

1. Agree on this structure and on the dependency rules in section 4.
2. Create the empty skeleton (`core`, `api`, `domains/auth`, `domains/selection`, `observability`) and the `.env.example`.
3. Decide the authentication approach (section 6.5) before the first protected endpoint.
4. Agree the allowed-origins list per environment with whoever owns the frontend.
5. Define the first vertical slice (suggestion: candidate list and CV score with explanation) to validate the structure end to end.

---

## 10. Sources

- FastAPI documentation, *Bigger Applications - Multiple Files*: https://fastapi.tiangolo.com/tutorial/bigger-applications/
- FastAPI documentation, CORS (CORSMiddleware)
- Sentry, *FastAPI error: No "Access-Control-Allow-Origin" header is present on the requested resource*
- Wristband docs, *Configure Cross-Origin Resource Sharing (CORS)* for FastAPI
- Nexova Solutions company briefing (4Geeks Academy, AI Engineering track)
