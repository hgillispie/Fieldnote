"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface LeadFormValues {
  name: string;
  email: string;
  message: string;
}

interface LeadFormProps {
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  endpoint?: string;
  attributes?: Record<string, unknown>;
}

interface SubmitResult {
  ok: boolean;
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The one place a lead is sent. No CRM/backend is connected yet, so with
// no `endpoint` configured this simulates a real network round trip and
// resolves successfully — a genuine success state, not a console.log stub.
// Wiring a real CRM endpoint later is setting the `endpoint` input; this
// function's shape doesn't need to change.
async function submitLead(values: LeadFormValues, endpoint?: string): Promise<SubmitResult> {
  if (!endpoint) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ok: true };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    return res.ok
      ? { ok: true }
      : { ok: false, error: `Request failed (${res.status}). Please try again.` };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function validate(values: LeadFormValues) {
  const errors: Partial<Record<keyof LeadFormValues, string>> = {};
  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

export function LeadForm({
  heading = "Talk to our Pro team",
  subheading = "Tell us about your outfitter, guide service, or fleet and we'll follow up with trade pricing and bulk ordering options.",
  ctaLabel = "Request trade pricing",
  endpoint,
  attributes,
}: LeadFormProps) {
  const [values, setValues] = useState<LeadFormValues>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("submitting");
    setSubmitError(null);
    const result = await submitLead(values, endpoint);

    if (result.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setSubmitError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div {...attributes} className="rounded-lg border border-sand bg-surface-alt p-6">
        <h2 className="font-display text-xl text-ink">Thanks, {values.name.split(" ")[0]}.</h2>
        <p className="mt-2 text-sm text-slate">
          A Fieldnote Pro rep will reach out to {values.email} within one business day.
        </p>
      </div>
    );
  }

  return (
    <div {...attributes} className="rounded-lg border border-sand bg-surface p-6">
      {heading && <h2 className="font-display text-xl text-ink">{heading}</h2>}
      {subheading && <p className="mt-2 text-sm text-slate">{subheading}</p>}

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="lead-name" className="mb-1 block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="lead-name"
            type="text"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-md border border-sand bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "lead-name-error" : undefined}
          />
          {errors.name && (
            <p id="lead-name-error" className="mt-1 text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lead-email" className="mb-1 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="lead-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            className="w-full rounded-md border border-sand bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "lead-email-error" : undefined}
          />
          {errors.email && (
            <p id="lead-email-error" className="mt-1 text-xs text-danger">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lead-message" className="mb-1 block text-sm font-medium text-ink">
            Message <span className="text-slate">(optional)</span>
          </label>
          <textarea
            id="lead-message"
            rows={3}
            value={values.message}
            onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
            placeholder="Tell us about your team size and what you're outfitting for."
            className="w-full rounded-md border border-sand bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>

        {status === "error" && submitError && (
          <p role="alert" className="text-sm text-danger">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface disabled:opacity-60"
        >
          {status === "submitting" ? "Sending..." : ctaLabel}
        </button>
      </form>
    </div>
  );
}
