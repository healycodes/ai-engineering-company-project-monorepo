"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/pipeline";
import { StageIndicator, StatusBadge } from "@/components/ui/Badges";
import { Alert, ErrorState, Spinner } from "@/components/ui/Feedback";
import { useCandidate } from "./CandidateProvider";
import { NotesPanel } from "./NotesPanel";
import { PipelineControls } from "./PipelineControls";

/** Where "Back to pipeline" should go, preserving the list's filters. */
export function useBackToPipeline() {
  const from = useSearchParams().get("from");
  return from ? `/?${from}` : "/";
}

export function CandidateDetail() {
  const { state, reload, candidateId } = useCandidate();
  const searchParams = useSearchParams();
  const backHref = useBackToPipeline();
  const justCreated = searchParams.get("created") === "1";
  const from = searchParams.get("from");

  return (
    <div className="space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-nexova-accent">
        ← Back to candidate pipeline
      </Link>

      {state.status === "loading" && <Spinner label="Loading candidate…" />}
      {state.status === "error" && <ErrorState message={state.error} onRetry={reload} />}

      {state.status === "success" && (
        <>
          {justCreated && (
            <Alert tone="success">
              Candidate registered and added to the pipeline as “Application received”.
            </Alert>
          )}

          <header className="card flex flex-wrap items-start justify-between gap-4 p-5">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{state.data.full_name}</h1>
              <p className="mt-0.5 text-sm text-slate-600">{state.data.position}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StatusBadge status={state.data.status} />
                <StageIndicator stage={state.data.stage} />
              </div>
            </div>
            <Link
              href={`/candidates/${candidateId}/edit${from ? `?from=${encodeURIComponent(from)}` : ""}`}
              className="btn btn-secondary"
            >
              Edit details
            </Link>
          </header>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-5">
              <CandidateProfile />
              <PipelineControls />
            </div>
            <NotesPanel />
          </div>
        </>
      )}
    </div>
  );
}

function CandidateProfile() {
  const { state } = useCandidate();
  if (state.status !== "success") return null;
  const c = state.data;

  const rows: { label: string; value: ReactNode }[] = [
    { label: "Email", value: <a className="text-nexova-accent hover:underline" href={`mailto:${c.email}`}>{c.email}</a> },
    { label: "Phone", value: <a className="text-nexova-accent hover:underline" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a> },
    { label: "Position", value: c.position },
    {
      label: "Experience",
      value: `${c.experience_years} ${c.experience_years === 1 ? "year" : "years"}`,
    },
    {
      label: "LinkedIn",
      value: c.linkedin_url ? <ExternalLink href={c.linkedin_url}>View profile</ExternalLink> : <Empty />,
    },
    {
      label: "CV",
      value: c.cv_url ? <ExternalLink href={c.cv_url}>Open CV</ExternalLink> : <Empty />,
    },
    { label: "Applied on", value: formatDate(c.applied_at) },
    { label: "Last updated", value: formatDate(c.updated_at, true) },
    { label: "Notes", value: c.notes_count },
  ];

  return (
    <section className="card p-5" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="mb-3 text-sm font-semibold text-slate-900">
        Candidate profile
      </h2>
      <dl className="divide-y divide-slate-100 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[8rem_1fr] gap-3 py-2">
            <dt className="text-slate-500">{r.label}</dt>
            <dd className="break-words text-slate-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-nexova-accent hover:underline">
      {children} ↗
    </a>
  );
}

function Empty() {
  return <span className="text-slate-400">Not provided</span>;
}
