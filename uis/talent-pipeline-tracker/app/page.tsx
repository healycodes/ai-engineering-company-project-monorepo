import { Suspense } from "react";
import { CandidateFilters } from "@/components/candidates/CandidateFilters";
import { CandidateList } from "@/components/candidates/CandidateList";
import { Spinner } from "@/components/ui/Feedback";

export default function CandidatesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Candidate pipeline</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every applicant in the active selection campaign. Filter by process status or selection
          stage, or search by name or email, then open a candidate to update their progress.
        </p>
      </div>

      {/* useSearchParams needs a Suspense boundary in the App Router */}
      <Suspense fallback={<Spinner label="Loading candidates…" />}>
        <div className="space-y-4">
          <CandidateFilters />
          <CandidateList />
        </div>
      </Suspense>
    </div>
  );
}
