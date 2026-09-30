"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { getCandidate, patchCandidate, updateCandidate } from "@/lib/api";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import type {
  AsyncState,
  Candidate,
  CandidateInput,
  CandidatePatch,
} from "@/types/candidate";

interface CandidateContextValue {
  candidateId: string;
  state: AsyncState<Candidate>;
  reload: () => void;
  /** PATCH status and/or stage. Throws on failure so the caller can show feedback. */
  updatePipeline: (patch: CandidatePatch) => Promise<Candidate>;
  /** PUT the candidate's profile data. Throws on failure. */
  saveProfile: (input: CandidateInput) => Promise<Candidate>;
  /** Keep the header's note counter in sync when notes change. */
  adjustNotesCount: (delta: number) => void;
}

const CandidateContext = createContext<CandidateContextValue | null>(null);

/**
 * Loads one candidate and shares it with every component under
 * /candidates/[id] (detail + edit), so nothing has to be passed down as props.
 */
export function CandidateProvider({ id, children }: { id: string; children: ReactNode }) {
  const { state, setData, reload } = useAsyncResource(`candidate:${id}`, () =>
    getCandidate(id),
  );

  const updatePipeline = useCallback(
    async (patch: CandidatePatch) => {
      const updated = await patchCandidate(id, patch);
      setData((prev) => ({ ...prev, ...updated }));
      return updated;
    },
    [id, setData],
  );

  const saveProfile = useCallback(
    async (input: CandidateInput) => {
      const updated = await updateCandidate(id, input);
      setData((prev) => ({ ...prev, ...updated }));
      return updated;
    },
    [id, setData],
  );

  const adjustNotesCount = useCallback(
    (delta: number) =>
      setData((prev) => ({ ...prev, notes_count: Math.max(0, prev.notes_count + delta) })),
    [setData],
  );

  const value = useMemo(
    () => ({ candidateId: id, state, reload, updatePipeline, saveProfile, adjustNotesCount }),
    [id, state, reload, updatePipeline, saveProfile, adjustNotesCount],
  );

  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>;
}

export function useCandidate(): CandidateContextValue {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error("useCandidate must be used inside <CandidateProvider>");
  return ctx;
}
