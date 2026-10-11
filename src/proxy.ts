import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LANG_COOKIE, locales, type Locale } from "@/i18n/config";

/** Saved choice first, then the browser's language, then Portuguese. */
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LANG_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;

  const accepted = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const match = accepted.find(({ lang }) => hasLocale(lang));
  return match ? (match.lang as Locale) : defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasPrefix) return;

  request.nextUrl.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals and any file with an extension (PDFs, icons…).
  matcher: ["/((?!_next|.*\\..*).*)"],
};
