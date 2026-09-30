import { Suspense } from "react";
import { EditCandidate } from "@/components/candidate/EditCandidate";
import { Spinner } from "@/components/ui/Feedback";

export default function EditCandidatePage() {
  return (
    <Suspense fallback={<Spinner label="Loading candidate…" />}>
      <EditCandidate />
    </Suspense>
  );
}
