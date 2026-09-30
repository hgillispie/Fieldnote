/**
 * Builder resolves a `reference` input to the *whole referenced entry* nested
 * under `value`, so the fields live at `ref.value.data` — not `ref.data`.
 * Reading `ref.data` yields `undefined` for every reference, which fails soft
 * into a component's fallback content instead of throwing, so it looks like
 * "the CMS has no data" rather than a field-path bug.
 */
export interface BuilderReference<TData> {
  "@type"?: string;
  id?: string;
  model?: string;
  value?: { id?: string; name?: string; data?: TData };
  /** Present when an entry is read directly (`fetchEntries`) rather than as a reference. */
  data?: TData;
}

export function resolveReference<TData>(
  ref: BuilderReference<TData> | null | undefined,
): TData | undefined {
  return ref?.value?.data ?? ref?.data;
}

interface LocalizedValue {
  "@type"?: string;
  Default?: string;
  [locale: string]: string | undefined;
}

/**
 * A `localized: true` field arrives as `{"@type":
 * "@builder.io/core:LocalizedValue", "Default": "...", "fr-FR": "..."}`
 * unless a `locale` was passed to the fetch, in which case the SDK already
 * resolves it to a plain string. Handles both shapes so callers don't need
 * to know which one they got.
 */
export function resolveLocalizedValue(
  value: string | LocalizedValue | null | undefined,
  locale = "Default",
): string | undefined {
  if (typeof value === "string") return value;
  return value?.[locale] ?? value?.Default;
}
