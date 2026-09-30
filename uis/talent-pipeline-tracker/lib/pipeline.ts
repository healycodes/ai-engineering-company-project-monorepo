import {
  CANDIDATE_STAGES,
  CANDIDATE_STATUSES,
  type CandidateStage,
  type CandidateStatus,
} from "@/types/candidate";

/**
 * Nexova Talent Selection terminology for the tracker's raw API values.
 * The API keeps its own field values; everything a consultant sees goes
 * through these maps.
 */
export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: "Application received",
  in_progress: "In selection process",
  selected: "Selected for placement",
  discarded: "Discarded",
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: "Awaiting CV screening",
  review: "Consultant CV review",
  personal_interview: "Competency interview",
  technical_interview: "Technical interview",
  offer_presented: "Offer presented",
};

export const STATUS_STYLES: Record<CandidateStatus, string> = {
  received: "bg-sky-50 text-sky-800 ring-sky-200",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-200",
  selected: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  discarded: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const STATUS_OPTIONS = CANDIDATE_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export const STAGE_OPTIONS = CANDIDATE_STAGES.map((value) => ({
  value,
  label: STAGE_LABELS[value],
}));

export function isStatus(value: string | null): value is CandidateStatus {
  return !!value && (CANDIDATE_STATUSES as readonly string[]).includes(value);
}

export function isStage(value: string | null): value is CandidateStage {
  return !!value && (CANDIDATE_STAGES as readonly string[]).includes(value);
}

export function stageIndex(stage: CandidateStage): number {
  return CANDIDATE_STAGES.indexOf(stage);
}

export function formatDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
