"use client";

import { createContext, useContext } from "react";
import { LANG_COOKIE, type Locale } from "./config";
import type { Dictionary } from "./dictionaries";

const I18nContext = createContext<{ lang: Locale; t: Dictionary } | null>(null);

export function I18nProvider({
  lang,
  t,
  children,
}: {
  lang: Locale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

/** Current language, its dictionary, and a helper to prefix internal links. */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  const { lang, t } = ctx;
  const href = (path: string) => (path === "/" ? `/${lang}` : `/${lang}${path}`);
  return { lang, t, href };
}

/** Remember the choice for a year; the proxy uses it on later visits. */
export function saveLangChoice(lang: Locale) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}
