/**
 * ENTERPRISE PATTERN: LOCALIZATION — shared resolution logic
 *
 * The single source of truth for turning "something that identifies a
 * locale" (a URL prefix segment, a `?locale=` query param) into the locale
 * code `fetchOneEntry` should be called with. Both `src/app/page.tsx` and
 * `src/app/[...slug]/page.tsx` resolve locale through this file so the
 * fallback semantics (requested locale -> locale group default -> space
 * default) and the RTL/HTML-lang mapping stay identical across every route,
 * rather than drifting into two slightly-different implementations.
 *
 * FULL FALLBACK CHAIN: requested locale -> locale group default -> space
 * default. Example: `ar-SA` isn't itself a configured locale, but it shares
 * the `ar` group, whose default is `ar-AE`. An unrecognized locale falls all
 * the way through to the space default (`locale: undefined`, Builder's own
 * sentinel for "the un-localized base entry").
 */
export const LOCALE_GROUP_DEFAULTS: Record<string, string> = {
  "en-us": "Default",
  "en-gb": "Default",
  "fr-fr": "fr-FR",
  "fr-ca": "fr-FR",
  "ar-ae": "ar-AE",
  "ar-sa": "ar-AE",
  "de-de": "de-DE",
  "es-mx": "es-MX",
  "ja-jp": "ja-JP",
};

export const RTL_LOCALES = new Set(["ar-AE"]);

// The 8 configured space locales, offered in the demo's locale switcher.
export const DEMO_LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "English (US, default)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "fr-CA", label: "Français (Canada)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "es-MX", label: "Español (México)" },
  { value: "ja-JP", label: "日本語" },
  { value: "ar-AE", label: "العربية — RTL" },
];

/**
 * Normalizes any raw locale code (URL prefix segment, query param value) to
 * the locale `fetchOneEntry` should request, per the fallback chain above.
 * Returns `undefined` for both "not a recognized locale" and "Default" —
 * `fetchOneEntry({ locale: undefined, ... })` resolves the space's
 * un-localized base entry in either case.
 */
export function resolveGroupDefaultLocale(
  rawLocale: string | undefined,
): string | undefined {
  if (!rawLocale) return undefined;
  const groupDefault = LOCALE_GROUP_DEFAULTS[rawLocale.toLowerCase()];
  if (!groupDefault || groupDefault === "Default") return undefined;
  return groupDefault;
}

export function resolveLocaleFromFirstSegment(segment: string | undefined): {
  locale: string | undefined;
  consumedSegment: boolean;
} {
  if (!segment) return { locale: undefined, consumedSegment: false };
  const normalized = segment.toLowerCase();
  if (!(normalized in LOCALE_GROUP_DEFAULTS)) {
    return { locale: undefined, consumedSegment: false };
  }
  return { locale: resolveGroupDefaultLocale(segment), consumedSegment: true };
}

/**
 * `?locale=` always wins over any locale derived from the URL path — this is
 * the one thing every route needs so a `?locale=ar-AE` query param reliably
 * overrides whatever the route would otherwise have resolved, for live demo
 * switching.
 */
export function resolveRequestedLocale(
  queryLocale: string | string[] | undefined,
  pathDerivedLocale?: string,
): string | undefined {
  const rawQuery = Array.isArray(queryLocale) ? queryLocale[0] : queryLocale;
  if (rawQuery) return resolveGroupDefaultLocale(rawQuery);
  return pathDerivedLocale;
}

export function isRtlLocale(locale: string | undefined): boolean {
  return !!locale && RTL_LOCALES.has(locale);
}

export function getHtmlLangDir(locale: string | undefined): {
  lang: string;
  dir: "ltr" | "rtl";
} {
  if (isRtlLocale(locale)) return { lang: "ar", dir: "rtl" };
  return { lang: locale ?? "en", dir: "ltr" };
}
