"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getHtmlLangDir, resolveGroupDefaultLocale } from "@/lib/locale";

/**
 * Root layout can't read `searchParams` itself (only page.js segments can),
 * so `?locale=` demo switching sets `<html lang>`/`dir` from the client
 * instead: read the query param post-hydration and mirror it onto
 * `document.documentElement`. This is the one place `dir="rtl"` for ar-AE
 * actually gets applied — every page route resolves its own Builder content
 * locale independently (see `src/lib/locale.ts`), but only this component
 * flips the document's writing direction.
 */
export function LocaleHtmlSync() {
  const searchParams = useSearchParams();
  const rawLocale = searchParams.get("locale") ?? undefined;
  const locale = resolveGroupDefaultLocale(rawLocale);

  useEffect(() => {
    const { lang, dir } = getHtmlLangDir(locale);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [locale]);

  return null;
}
