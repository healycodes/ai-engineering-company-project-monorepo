# Nexova Talent Pipeline Tracker

Internal tool for **Nexova Solutions' Talent Selection Operations** team (Javier Almeida's 40 selection consultants). It replaces the shared spreadsheet, scattered interview notes and email status updates used during recruitment campaigns with a single view of every candidate in the pipeline.

Built as the *Talent Pipeline Tracker* milestone of the 4Geeks Academy AI Engineering programme, on top of the Talent Tracker REST API ([docs](https://playground.4geeks.com/tracker/api/v1/docs)).

## What consultants can do

| Need | Where |
| --- | --- |
| See every candidate with position, process status and selection stage | `/` |
| Filter by status and stage (kept in the URL: `?status=&stage=`) and search by name or email — no page reloads | `/` |
| Open a candidate's full profile (contact, LinkedIn, CV, experience, application date) | `/candidates/[id]` |
| Change status or stage in one interaction, or advance to the next stage with one click (`PATCH`) | `/candidates/[id]` |
| Read, add and delete internal consultant notes | `/candidates/[id]` |
| Register a new candidate (`POST`) | `/candidates/new` |
| Correct a candidate's data (`PUT`) | `/candidates/[id]/edit` |

Every request shows a loading state, an error state (with *Try again* where it makes sense) and success feedback. Filters are preserved when moving from the list to a candidate and back.

### Nexova terminology

The API values stay as the backend defines them; the UI shows them in Nexova's selection vocabulary (`lib/pipeline.ts`):

| API `status` | Shown as | | API `stage` | Shown as |
| --- | --- | --- | --- | --- |
| `received` | Application received | | `pending` | Awaiting CV screening |
| `in_progress` | In selection process | | `review` | Consultant CV review |
| `selected` | Selected for placement | | `personal_interview` | Competency interview |
| `discarded` | Discarded | | `technical_interview` | Technical interview |
| | | | `offer_presented` | Offer presented |

## Tech

Next.js (App Router) · React · TypeScript · Tailwind CSS. No external state library — hooks and one React context.

```
app/
  page.tsx                     candidate list (filters + table)
  candidates/new/page.tsx      register form
  candidates/[id]/layout.tsx   loads the candidate once (CandidateProvider)
  candidates/[id]/page.tsx     detail view
  candidates/[id]/edit/page.tsx edit form
components/
  candidates/                  list view: CandidateFilters, CandidateList
  candidate/                   detail view: CandidateProvider (context), CandidateDetail,
                               PipelineControls, NotesPanel, CandidateForm, EditCandidate
  layout/  ui/                 header, badges, spinner / alert / error state
hooks/
  useAsyncResource.ts          loading / success / error state for any fetch
  useCandidates.ts useNotes.ts usePipelineQuery.ts useDebouncedValue.ts
lib/
  api.ts                       every API call (async/await, typed, readable errors)
  pipeline.ts                  Nexova labels, badge styles, date formatting
types/
  candidate.ts                 API types (Candidate, Note, inputs, responses)
```

**State without prop drilling:** list filters live in the URL and are read with `useSearchParams` by whichever component needs them (`usePipelineQuery`). On the candidate page, `CandidateProvider` (in the `[id]` layout) holds the candidate and exposes `updatePipeline` / `saveProfile`; the profile, pipeline controls, notes and edit form all read it with `useCandidate()`. After a `PATCH`, `PUT`, `POST` or note change the local state is updated from the API response, so the UI changes without reloading.

## Run it

```bash
cd uis/talent-pipeline-tracker
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 (in Codespaces, open the forwarded port 3000).

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the Talent Tracker API, e.g. `https://playground.4geeks.com/tracker/api/v1` |

Other scripts: `npm run build`, `npm run start`, `npm run lint`.
