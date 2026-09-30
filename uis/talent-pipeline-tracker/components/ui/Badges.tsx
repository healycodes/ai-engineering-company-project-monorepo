import { STAGE_LABELS, STATUS_LABELS, STATUS_STYLES, stageIndex } from "@/lib/pipeline";
import { CANDIDATE_STAGES, type CandidateStage, type CandidateStatus } from "@/types/candidate";

export function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Stage label plus a small progress bar showing where the candidate is in the process. */
export function StageIndicator({ stage }: { stage: CandidateStage }) {
  const idx = stageIndex(stage);
  return (
    <div className="min-w-36">
      <div className="text-sm text-slate-800">{STAGE_LABELS[stage] ?? stage}</div>
      <div className="mt-1 flex gap-0.5" aria-hidden>
        {CANDIDATE_STAGES.map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-nexova-accent" : "bg-slate-200"}`}
          />
        ))}
      </div>
    </div>
  );
}
