"use client";

import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/pipeline";
import { useNotes } from "@/hooks/useNotes";
import { Alert, ErrorState, Spinner } from "@/components/ui/Feedback";
import { useCandidate } from "./CandidateProvider";

const MAX_NOTE = 2000;

/** Internal consultant notes: list (GET), add (POST) and delete (DELETE). */
export function NotesPanel() {
  const { candidateId, adjustNotesCount } = useCandidate();
  const { state, reload, addNote, removeNote } = useNotes(candidateId);

  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) {
      setFeedback({ tone: "error", text: "Write something before adding the note." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await addNote(content);
      adjustNotesCount(1);
      setDraft("");
      setFeedback({ tone: "success", text: "Note added." });
    } catch (err) {
      setFeedback({ tone: "error", text: `Couldn’t add the note: ${errorMessage(err)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!window.confirm("Delete this note? This can’t be undone.")) return;
    setDeletingId(noteId);
    setFeedback(null);
    try {
      await removeNote(noteId);
      adjustNotesCount(-1);
      setFeedback({ tone: "success", text: "Note deleted." });
    } catch (err) {
      setFeedback({ tone: "error", text: `Couldn’t delete the note: ${errorMessage(err)}` });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="card space-y-4 p-5" aria-labelledby="notes-heading">
      <div className="flex items-baseline justify-between">
        <h2 id="notes-heading" className="text-sm font-semibold text-slate-900">
          Consultant notes
        </h2>
        <span className="text-xs text-slate-500">Internal · not visible to the client or candidate</span>
      </div>

      <form onSubmit={handleAdd} className="space-y-2">
        <label htmlFor="new-note" className="sr-only">
          New note
        </label>
        <textarea
          id="new-note"
          className="field min-h-24 resize-y"
          placeholder="Interview impressions, references checked, next steps…"
          value={draft}
          maxLength={MAX_NOTE}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {draft.length}/{MAX_NOTE}
          </span>
          <button type="submit" className="btn btn-primary" disabled={saving || !draft.trim()}>
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {saving ? "Adding…" : "Add note"}
          </button>
        </div>
      </form>

      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      {state.status === "loading" && <Spinner label="Loading notes…" />}
      {state.status === "error" && <ErrorState message={state.error} onRetry={reload} />}
      {state.status === "success" &&
        (state.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No notes yet. Add the first one after screening or an interview.
          </p>
        ) : (
          <ul className="space-y-3">
            {[...state.data]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((note) => (
                <li
                  key={note.id}
                  className={`rounded-lg border border-slate-200 bg-slate-50 p-3 transition-opacity ${deletingId === note.id ? "opacity-50" : ""}`}
                >
                  <p className="whitespace-pre-wrap text-sm text-slate-800">{note.content}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <time dateTime={note.created_at}>{formatDate(note.created_at, true)}</time>
                    <button
                      type="button"
                      className="btn btn-danger px-2 py-1 text-xs"
                      disabled={deletingId !== null}
                      onClick={() => handleDelete(note.id)}
                    >
                      {deletingId === note.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        ))}
    </section>
  );
}
