import type {
  ApiValidationError,
  Candidate,
  CandidateFilters,
  CandidateInput,
  CandidatePatch,
  Note,
  NoteInput,
  NotesResponse,
  PaginatedCandidates,
} from "@/types/candidate";

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://playground.4geeks.com/tracker/api/v1"
).replace(/\/$/, "");

/** Error carrying a user-readable message and the HTTP status. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name",
  email: "Email",
  phone: "Phone",
  position: "Position",
  linkedin_url: "LinkedIn",
  cv_url: "CV link",
  experience_years: "Years of experience",
  content: "Note",
};

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object") {
      if ("detail" in body && Array.isArray((body as ApiValidationError).detail)) {
        message = (body as ApiValidationError).detail
          .map((d) => {
            const field = String(d.loc[d.loc.length - 1]);
            return `${FIELD_LABELS[field] ?? field}: ${d.msg}`;
          })
          .join(" · ");
      } else if ("error" in body && typeof body.error === "string") {
        message = body.error;
      } else if ("detail" in body && typeof body.detail === "string") {
        message = body.detail;
      }
    }
  } catch {
    // body was not JSON — keep the generic message
  }
  if (res.status === 404) message = "Candidate not found. It may have been removed.";
  return new ApiError(message, res.status);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Could not reach the talent pipeline service. Check your connection and try again.",
      0,
    );
  }
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

// ---- Candidates (records) -------------------------------------------------

export async function getCandidates(
  filters: CandidateFilters = {},
): Promise<PaginatedCandidates> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.search) params.set("search", filters.search);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));
  return request<PaginatedCandidates>(`/records?${params.toString()}`);
}

export async function getCandidate(id: string): Promise<Candidate> {
  return request<Candidate>(`/records/${encodeURIComponent(id)}`);
}

export async function createCandidate(input: CandidateInput): Promise<Candidate> {
  return request<Candidate>("/records", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCandidate(
  id: string,
  input: CandidateInput,
): Promise<Candidate> {
  return request<Candidate>(`/records/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function patchCandidate(
  id: string,
  patch: CandidatePatch,
): Promise<Candidate> {
  return request<Candidate>(`/records/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ---- Notes ----------------------------------------------------------------

export async function getNotes(candidateId: string): Promise<Note[]> {
  const res = await request<NotesResponse>(
    `/records/${encodeURIComponent(candidateId)}/notes`,
  );
  return res.data;
}

export async function createNote(
  candidateId: string,
  input: NoteInput,
): Promise<Note> {
  return request<Note>(`/records/${encodeURIComponent(candidateId)}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteNote(candidateId: string, noteId: string): Promise<void> {
  await request<void>(
    `/records/${encodeURIComponent(candidateId)}/notes/${encodeURIComponent(noteId)}`,
    { method: "DELETE" },
  );
}
