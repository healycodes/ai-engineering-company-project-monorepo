"use client";

import { getCandidates } from "@/lib/api";
import type { CandidateFilters } from "@/types/candidate";
import { useAsyncResource } from "./useAsyncResource";

/** Fetches the candidate list for the given filters (status, stage, search, page). */
export function useCandidates(filters: CandidateFilters) {
  const key = JSON.stringify(filters);
  return useAsyncResource(key, () => getCandidates(filters));
}
