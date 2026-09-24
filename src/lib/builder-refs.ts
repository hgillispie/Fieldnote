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
