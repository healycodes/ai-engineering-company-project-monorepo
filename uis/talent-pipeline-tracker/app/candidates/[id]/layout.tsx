import { CandidateProvider } from "@/components/candidate/CandidateProvider";

/**
 * Loads the candidate once for both the detail view and the edit form,
 * so moving between them keeps the data (and any edits) without refetching.
 */
export default async function CandidateLayout({ params, children }: LayoutProps<"/candidates/[id]">) {
  const { id } = await params;
  return <CandidateProvider id={id}>{children}</CandidateProvider>;
}
