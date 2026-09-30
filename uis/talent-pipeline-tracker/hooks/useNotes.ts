"use client";

import { useCallback } from "react";
import { createNote, deleteNote, getNotes } from "@/lib/api";
import type { Note } from "@/types/candidate";
import { useAsyncResource } from "./useAsyncResource";

/**
 * Notes for one candidate. Mutations call the API and then update the local
 * list, so the UI reflects the change without refetching or reloading.
 * Errors are thrown back to the caller so each form can show its own feedback.
 */
export function useNotes(candidateId: string) {
  const { state, setData, reload } = useAsyncResource<Note[]>(
    `notes:${candidateId}`,
    () => getNotes(candidateId),
  );

  const addNote = useCallback(
    async (content: string) => {
      const note = await createNote(candidateId, { content });
      setData((prev) => [note, ...prev]);
      return note;
    },
    [candidateId, setData],
  );

  const removeNote = useCallback(
    async (noteId: string) => {
      await deleteNote(candidateId, noteId);
      setData((prev) => prev.filter((n) => n.id !== noteId));
    },
    [candidateId, setData],
  );

  return { state, reload, addNote, removeNote };
}
