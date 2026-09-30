"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCandidate } from "@/lib/api";
import { CandidateForm } from "@/components/candidate/CandidateForm";

export default function NewCandidatePage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-nexova-accent">
        ← Back to candidate pipeline
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Register a candidate</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add an applicant who came in outside the usual channels — a referral, a headhunted
          profile or an application sent by email. They start at “Application received”.
        </p>
      </div>

      <CandidateForm
        submitLabel="Register candidate"
        onCancel={() => router.push("/")}
        onSubmit={async (input) => {
          const created = await createCandidate(input);
          router.push(`/candidates/${created.id}?created=1`);
        }}
      />
    </div>
  );
}
