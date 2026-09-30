"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isStage, isStatus } from "@/lib/pipeline";
import type { CandidateFilters } from "@/types/candidate";

export const PAGE_SIZE = 20;

/**
 * The candidate list's filters live in the URL (?status=&stage=&search=&page=),
 * so they survive refreshes, can be shared with colleagues, and work with the
 * back button. Updates use router.replace — no full page reload.
 */
export function usePipelineQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: CandidateFilters = useMemo(() => {
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");
    const page = Number(searchParams.get("page") ?? "1");
    return {
      status: isStatus(status) ? status : undefined,
      stage: isStage(stage) ? stage : undefined,
      search: searchParams.get("search")?.trim() || undefined,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      limit: PAGE_SIZE,
    };
  }, [searchParams]);

  /** Set (or clear, with null/"") one or more params. Any filter change resets to page 1. */
  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!("page" in updates)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const clearAll = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  const activeCount = [filters.status, filters.stage, filters.search].filter(Boolean).length;

  return { filters, setParams, clearAll, activeCount, queryString: searchParams.toString() };
}
