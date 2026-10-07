# Nexova Backend: Architecture Proposal

Hi Sergio, here is my plan for how we should build the backend. No code, just my thinking.

---

## 1. What we are building

Nexova is an HR company with many departments: Talent Selection, Training, Support, Sales, HR, Marketing and the CEO's dashboards. We need one backend that serves all of them.

Three things matter for my decision:

- We have **many departments** but only **6 people** in tech.
- **AI is the main product** (CV scoring, search, chatbots), so we must be able to explain the results.
- The company uses **old, separate tools** (HubSpot, Zendesk, the old ATS) and has **no logging**.

---

## 2. The pattern I chose: layered architecture, split by department

I suggest **one FastAPI app**, split into **domains** (one per department). Inside each domain we use simple layers:

```
Router (receives the request) → Service (business rules) → Repository (database)
```

**Why this is good for Nexova:**

- Each department is its own module, so the code stays organised like the company.
- One app is easier for a small team: one repo, one deployment, one place for logs.
- Keeping the rules in services (not in routes) lets us test and explain the AI scoring.
- If one part grows a lot later (for example support), we can move it out more easily.

**What I did not choose:**

- **MVC:** our frontend is separate, so the backend has no pages to show.
- **Microservices:** too hard to manage for 6 people with no monitoring yet.
- **Serverless:** not good for a big system with shared data and long AI tasks.

---

## 3. What I learned about normal FastAPI projects

I read the official FastAPI documentation about bigger applications and settings. These are the main ideas and how I use them:

- **Split the app into many files.** Every folder is a package with an `__init__.py`.
- **Use one `APIRouter` per module.** The main file only adds the routers. So I use one router per domain.
- **Routers can have shared dependencies**, like "user must be logged in". I set this per router, not per endpoint.
- **Settings come from environment variables.** I put all settings in one file, `core/config.py`.
- **Pydantic models define the data.** I keep `schemas.py` (what the API sends and receives) separate from `models.py` (what is stored).

The docs example groups files by type (like a `routers` folder). Because we have many departments, I group by domain first, so one feature is not spread over many folders. The one-router-per-module idea stays the same.

---

## 4. Folder structure

```
nexova-monorepo/
├── backend/
│   ├── app/
│   │   ├── main.py            # starts the app, adds CORS, adds routers
│   │   ├── core/              # config, database, security, logging
│   │   ├── api/               # shared dependencies, v1 router
│   │   ├── domains/
│   │   │   ├── auth/
│   │   │   ├── selection/
│   │   │   ├── training/
│   │   │   ├── support/
│   │   │   ├── sales/
│   │   │   ├── hr/
│   │   │   ├── marketing/
│   │   │   └── executive/
│   │   │     (each has: router, schemas, models, service, repository)
│   │   ├── ai/                # shared AI helpers
│   │   ├── integrations/      # hubspot, zendesk, old ATS, google
│   │   └── observability/     # health check
│   ├── tests/
│   └── .env.example
├── frontend/
└── docs/ARCHITECTURE_PROPOSAL.md
```

**How I decided what goes where:**

1. **By department:** code that changes for one team stays together.
2. **By layer:** router for HTTP, service for rules, repository for data.
3. **Shared tools** (like AI helpers) go in `ai/`. What to do with them stays in the domain.
4. **Outside tools** (HubSpot, Zendesk, old ATS) only appear in `integrations/`.
5. **Domains do not touch each other's database code.** They talk through services.

---

## 5. Routers and endpoints

Each domain has its own router. All routes start with `/api/v1`.

| Domain | Route start | Examples |
|---|---|---|
| auth | `/api/v1/auth` | login, current user |
| selection | `/api/v1/selection` | vacancies, candidates, applications, CV scoring, candidate search, status |
| training | `/api/v1/training` | catalogue, enrolments, progress, recommendations |
| support | `/api/v1/support` | tickets, knowledge base search, chatbot |
| sales | `/api/v1/sales` | prospects, deals, alerts |
| hr | `/api/v1/hr` | employees, leave requests, onboarding |
| marketing | `/api/v1/marketing` | traffic and conversion numbers, content |
| executive | `/api/v1/executive` | KPIs, weekly report, assistant |
| system | `/api/v1/system` | health check |

**Rules for grouping:**

- A route goes in the domain that **owns the data**.
- Access rules are set on the router (for example, only HR people use `hr`).
- The executive domain only **reads** from other domains. It never copies their logic.

---

## 6. Frontend and backend are separate

- **Same repo, two apps.** `backend/` and `frontend/` are in one monorepo, but they run and install separately. They only share the API.
- **Communication:** the frontend calls the backend with JSON over HTTP. The routes are versioned (`/api/v1`).
- **CORS:** the frontend and backend run on different addresses, and browsers block that by default. So the backend must allow the frontend. We add FastAPI's `CORSMiddleware` once in `main.py` and list the **exact frontend addresses**, not "allow all".
- **Environment variables:** secrets (database, AI keys) stay only in the backend. We never commit `.env`. We keep a `.env.example` that lists every variable. The frontend only needs the backend URL, and never any secret.

---

## 7. Risks if we do not follow this

1. **Business rules inside routers.** The same rule gets copied in many places and is hard to test. *Fix:* routers only receive, call a service and answer.
2. **Everything in one big file.** Six developers cannot work together and nobody owns anything. *Fix:* one router per domain.
3. **Domains reading each other's data directly.** A change in one department breaks another one's dashboard. *Fix:* use services only.
4. **Calling HubSpot, Zendesk or the old ATS from everywhere.** One change on their side breaks many places. *Fix:* only use `integrations/`.
5. **Bad CORS or secrets in the wrong place.** "Allow all" is a security risk and leaked keys are worse. *Fix:* exact origins and backend-only secrets.
6. **Trying to build all domains at once.** Too much for a small team. *Fix:* start with `auth`, `selection` and the health check, then add the rest.
