"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CandidateForm } from "./CandidateForm";
import { useCandidate } from "./CandidateProvider";
import { ErrorState, Spinner } from "@/components/ui/Feedback";

/** PUT /records/:id — correct a candidate's profile data. */
export function EditCandidate() {
  const { state, reload, candidateId, saveProfile } = useCandidate();
  const router = useRouter();
  const from = useSearchParams().get("from");
  const detailHref = `/candidates/${candidateId}${from ? `?from=${encodeURIComponent(from)}` : ""}`;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={detailHref} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-nexova-accent">
        ← Back to candidate
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Edit candidate details</h1>
        <p className="mt-1 text-sm text-slate-600">
          Correct contact details, the position or links. Status and stage are managed from the
          candidate’s page.
        </p>
      </div>

      {state.status === "loading" && <Spinner label="Loading candidate…" />}
      {state.status === "error" && <ErrorState message={state.error} onRetry={reload} />}
      {state.status === "success" && (
        <CandidateForm
          // Remount if a different candidate loads so the form starts from fresh values.
          key={state.data.id}
          initial={state.data}
          submitLabel="Save changes"
          onCancel={() => router.push(detailHref)}
          onSubmit={async (input) => {
            const saved = await saveProfile(input);
            return `Changes to ${saved.full_name} saved.`;
          }}
        />
      )}
    </div>
  );
}
