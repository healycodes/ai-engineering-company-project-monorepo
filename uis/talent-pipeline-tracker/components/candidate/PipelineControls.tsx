"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api";
import { STAGE_LABELS, STAGE_OPTIONS, STATUS_LABELS, STATUS_OPTIONS, stageIndex } from "@/lib/pipeline";
import { CANDIDATE_STAGES, type CandidateStage, type CandidateStatus } from "@/types/candidate";
import { Alert } from "@/components/ui/Feedback";
import { useCandidate } from "./CandidateProvider";

type Pending = "status" | "stage" | null;

/** Change status or stage in one interaction (PATCH /records/:id). */
export function PipelineControls() {
  const { state, updatePipeline } = useCandidate();
  const [pending, setPending] = useState<Pending>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (state.status !== "success") return null;
  const candidate = state.data;
  const nextStage: CandidateStage | undefined = CANDIDATE_STAGES[stageIndex(candidate.stage) + 1];

  async function apply(field: "status" | "stage", value: string) {
    setPending(field);
    setFeedback(null);
    try {
      if (field === "status") {
        await updatePipeline({ status: value as CandidateStatus });
        setFeedback({ tone: "success", text: `Status updated to “${STATUS_LABELS[value as CandidateStatus]}”.` });
      } else {
        await updatePipeline({ stage: value as CandidateStage });
        setFeedback({ tone: "success", text: `Moved to “${STAGE_LABELS[value as CandidateStage]}”.` });
      }
    } catch (err) {
      setFeedback({ tone: "error", text: `Couldn’t update the ${field}: ${errorMessage(err)}` });
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="card space-y-4 p-5" aria-labelledby="pipeline-heading">
      <h2 id="pipeline-heading" className="text-sm font-semibold text-slate-900">
        Selection progress
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
            Process status
            {pending === "status" && <MiniSpinner />}
          </span>
          <select
            className="field"
            value={candidate.status}
            disabled={pending !== null}
            onChange={(e) => apply("status", e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
            Selection stage
            {pending === "stage" && <MiniSpinner />}
          </span>
          <select
            className="field"
            value={candidate.stage}
            disabled={pending !== null}
            onChange={(e) => apply("stage", e.target.value)}
          >
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {nextStage && candidate.status !== "discarded" && (
        <button
          type="button"
          className="btn btn-secondary w-full sm:w-auto"
          disabled={pending !== null}
          onClick={() => apply("stage", nextStage)}
        >
          Advance to {STAGE_LABELS[nextStage]} →
        </button>
      )}

      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}
    </section>
  );
}

function MiniSpinner() {
  return (
    <span
      aria-label="Saving"
      className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-nexova-accent"
    />
  );
}
