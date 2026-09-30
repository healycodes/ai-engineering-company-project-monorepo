"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { errorMessage } from "@/lib/api";
import { Alert } from "@/components/ui/Feedback";
import type { Candidate, CandidateInput } from "@/types/candidate";

type FormValues = Record<keyof CandidateInput, string>;
type FormErrors = Partial<Record<keyof CandidateInput, string>>;

const EMPTY: FormValues = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};

function toValues(c?: Candidate): FormValues {
  if (!c) return EMPTY;
  return {
    full_name: c.full_name,
    email: c.email,
    phone: c.phone,
    position: c.position,
    linkedin_url: c.linkedin_url ?? "",
    cv_url: c.cv_url ?? "",
    experience_years: String(c.experience_years),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {};
  if (!v.full_name.trim()) e.full_name = "Enter the candidate’s full name.";
  if (!v.email.trim()) e.email = "Enter an email address.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email, e.g. name@company.com.";
  if (!v.phone.trim()) e.phone = "Enter a phone number.";
  else if (!/^[+\d][\d\s().-]{5,}$/.test(v.phone.trim()))
    e.phone = "Use digits, spaces and an optional leading +.";
  if (!v.position.trim()) e.position = "Enter the position the candidate applied for.";
  if (v.experience_years.trim() === "") e.experience_years = "Enter years of experience.";
  else {
    const n = Number(v.experience_years);
    if (!Number.isFinite(n) || n < 0 || n > 60)
      e.experience_years = "Enter a number between 0 and 60.";
  }
  if (v.linkedin_url.trim() && !isUrl(v.linkedin_url.trim()))
    e.linkedin_url = "Enter a full URL starting with https://";
  if (v.cv_url.trim() && !isUrl(v.cv_url.trim()))
    e.cv_url = "Enter a full URL starting with https://";
  return e;
}

function toInput(v: FormValues): CandidateInput {
  return {
    full_name: v.full_name.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
    position: v.position.trim(),
    linkedin_url: v.linkedin_url.trim() || null,
    cv_url: v.cv_url.trim() || null,
    experience_years: Number(v.experience_years),
  };
}

interface Props {
  initial?: Candidate;
  submitLabel: string;
  /** Returns a success message to show, or throws to show an error. */
  onSubmit: (input: CandidateInput) => Promise<string | void>;
  onCancel?: () => void;
}

export function CandidateForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<FormValues>(() => toValues(initial));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  const set = (field: keyof FormValues) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFeedback({ tone: "error", text: "Please fix the highlighted fields before saving." });
      return;
    }
    setSubmitting(true);
    try {
      const msg = await onSubmit(toInput(values));
      if (msg) setFeedback({ tone: "success", text: msg });
    } catch (err) {
      setFeedback({ tone: "error", text: errorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-6 p-5 sm:p-6">
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <fieldset className="space-y-4" disabled={submitting}>
        <legend className="text-sm font-semibold text-slate-900">Candidate details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.full_name}>
            <input className="field" value={values.full_name} onChange={(e) => set("full_name")(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input className="field" type="email" value={values.email} onChange={(e) => set("email")(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input className="field" type="tel" value={values.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+34 600 000 000" />
          </Field>
          <Field label="Years of experience" required error={errors.experience_years}>
            <input className="field" type="number" min={0} max={60} step={1} inputMode="numeric" value={values.experience_years} onChange={(e) => set("experience_years")(e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4" disabled={submitting}>
        <legend className="text-sm font-semibold text-slate-900">Selection process</legend>
        <Field label="Position applied for" required error={errors.position}>
          <input className="field" value={values.position} onChange={(e) => set("position")(e.target.value)} placeholder="e.g. B2B Account Manager" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn profile" error={errors.linkedin_url}>
            <input className="field" type="url" value={values.linkedin_url} onChange={(e) => set("linkedin_url")(e.target.value)} placeholder="https://linkedin.com/in/…" />
          </Field>
          <Field label="CV link" error={errors.cv_url}>
            <input className="field" type="url" value={values.cv_url} onChange={(e) => set("cv_url")(e.target.value)} placeholder="https://…" />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <p className="mr-auto text-xs text-slate-500">
          <span className="text-rose-600">*</span> Required
        </p>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      <div className={error ? "[&_.field]:border-rose-400 [&_.field]:ring-2 [&_.field]:ring-rose-100" : ""}>
        {children}
      </div>
      {error && <span className="mt-1 block text-xs text-rose-700">{error}</span>}
    </label>
  );
}
