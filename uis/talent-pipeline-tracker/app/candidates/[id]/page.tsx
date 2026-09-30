import { Suspense } from "react";
import { CandidateDetail } from "@/components/candidate/CandidateDetail";
import { Spinner } from "@/components/ui/Feedback";

export default function CandidatePage() {
  return (
    <Suspense fallback={<Spinner label="Loading candidate…" />}>
      <CandidateDetail />
    </Suspense>
  );
}
