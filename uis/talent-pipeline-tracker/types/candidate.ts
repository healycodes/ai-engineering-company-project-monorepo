/**
 * Types mirroring the Talent Tracker API (see /docs on the API host).
 * Field names stay exactly as the backend defines them; the Nexova-facing
 * labels for these values live in `lib/pipeline.ts`.
 */

export const CANDIDATE_STATUSES = [
  "received",
  "in_progress",
  "selected",
  "discarded",
] as const;

export const CANDIDATE_STAGES = [
  "pending",
  "review",
  "personal_interview",
  "technical_interview",
  "offer_presented",
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];
export type CandidateStage = (typeof CANDIDATE_STAGES)[number];

export interface Note {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  applied_at: string;
  updated_at: string;
  notes_count: number;
  /** Included by GET /records, not guaranteed on every response. */
  notes?: Note[];
}

/** Body for POST /records and PUT /records/:id */
export interface CandidateInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
}

/** Body for PATCH /records/:id */
export interface CandidatePatch {
  status?: CandidateStatus;
  stage?: CandidateStage;
}

export interface NoteInput {
  content: string;
}

export interface PaginatedCandidates {
  total: number;
  page: number;
  limit: number;
  data: Candidate[];
}

export interface NotesResponse {
  data: Note[];
  meta: { total: number };
}

export interface CandidateFilters {
  status?: CandidateStatus;
  stage?: CandidateStage;
  search?: string;
  page?: number;
  limit?: number;
}

/** Shape of a FastAPI/Pydantic 422 error */
export interface ApiValidationError {
  detail: { loc: (string | number)[]; msg: string; type: string }[];
}

/** Generic async state used by every data hook */
export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };
