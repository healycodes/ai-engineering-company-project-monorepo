"use client";

import Link from "next/link";
import { useCandidates } from "@/hooks/useCandidates";
import { PAGE_SIZE, usePipelineQuery } from "@/hooks/usePipelineQuery";
import { formatDate } from "@/lib/pipeline";
import { StageIndicator, StatusBadge } from "@/components/ui/Badges";
import { ErrorState, Spinner } from "@/components/ui/Feedback";

export function CandidateList() {
  const { filters, setParams, clearAll, activeCount, queryString } = usePipelineQuery();
  const { state, previous, reload } = useCandidates(filters);

  // Keep the previous page visible (dimmed) while a new filter is loading,
  // instead of flashing an empty table on every keystroke.
  const result = state.status === "success" ? state.data : previous;
  const loading = state.status === "loading";

  if (state.status === "error") {
    return <ErrorState message={state.error} onRetry={reload} />;
  }
  if (!result) return <Spinner label="Loading candidates…" />;

  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const backTo = queryString ? `?from=${encodeURIComponent(queryString)}` : "";

  return (
    <section aria-busy={loading} className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <p>
          <strong className="text-slate-900">{result.total}</strong>{" "}
          {result.total === 1 ? "candidate" : "candidates"}
          {activeCount > 0 && " match your filters"}
        </p>
        {loading && (
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-nexova-accent" />
            Updating…
          </span>
        )}
      </div>

      {result.data.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-600">
          <p className="font-medium text-slate-900">No candidates found</p>
          <p className="mt-1">Try a different name or email, or clear the filters.</p>
          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="btn btn-secondary mt-4">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={`card overflow-hidden transition-opacity ${loading ? "opacity-60" : ""}`}>
          {/* Table on larger screens */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Position</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.data.map((c) => (
                <tr key={c.id} className="group hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/candidates/${c.id}${backTo}`}
                      className="font-medium text-slate-900 group-hover:text-nexova-accent"
                    >
                      {c.full_name}
                    </Link>
                    <div className="text-xs text-slate-500">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.position}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StageIndicator stage={c.stage} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(c.applied_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards on phones */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {result.data.map((c) => (
              <li key={c.id}>
                <Link href={`/candidates/${c.id}${backTo}`} className="block space-y-2 p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-900">{c.full_name}</div>
                      <div className="text-xs text-slate-500">{c.position}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <StageIndicator stage={c.stage} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1 || loading}
            onClick={() => setParams({ page: String(page - 1) })}
          >
            ← Previous
          </button>
          <span className="text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages || loading}
            onClick={() => setParams({ page: String(page + 1) })}
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  );
}
