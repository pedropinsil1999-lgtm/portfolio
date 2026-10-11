export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";

/** Cookie that remembers the visitor's language choice. */
export const LANG_COOKIE = "lang";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Same path in another language: /pt/sobre -> /en/sobre. */
export function swapLocale(pathname: string, to: Locale) {
  const parts = pathname.split("/");
  if (hasLocale(parts[1] ?? "")) parts[1] = to;
  else parts.splice(1, 0, to);
  return parts.join("/") || `/${to}`;
}
