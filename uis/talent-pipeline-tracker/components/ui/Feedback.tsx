import type { ReactNode } from "react";

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-nexova-accent" />
      {label}
    </div>
  );
}

type Tone = "error" | "success" | "info";

const TONES: Record<Tone, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

export function Alert({
  tone,
  children,
  action,
}: {
  tone: Tone;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      tone="error"
      action={
        onRetry && (
          <button type="button" onClick={onRetry} className="btn btn-secondary py-1.5">
            Try again
          </button>
        )
      }
    >
      <strong className="font-semibold">Couldn’t load data.</strong> {message}
    </Alert>
  );
}
