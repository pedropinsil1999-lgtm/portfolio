"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { swapLocale } from "@/i18n/config";
import { saveLangChoice, useI18n } from "@/i18n/I18nProvider";

// Pill colour follows the page (see ScrollTheme): blue surface on dark
// sections, the text navy on light ones. When the pills pass over a surface
// of their own colour (e.g. the service cards), they switch to a contrasting
// one. Hairline border keeps the edge.
const pill =
  "rounded-full border border-branco/10 bg-[var(--pill-surface,var(--pill-bg))] text-branco transition-colors duration-500";

// Pill colour to use over each `data-surface`.
const overSurface: Record<string, string> = { grafite: "#042a41" };

export default function Header() {
  const pathname = usePathname();
  const { lang, t, href } = useI18n();
  const other = lang === "pt" ? "en" : "pt";
  const header = useRef<HTMLElement>(null);

  // Watch what sits under the pills while scrolling (throttled hit tests).
  useEffect(() => {
    const el = header.current;
    if (!el) return;
    let timer = 0;
    let current = "";
    // The header is fixed, so the points to probe (each pill's centre) only
    // change on resize; they are measured then, not on every check.
    let points: [number, number][] = [];
    const measure = () => {
      points = [...el.querySelectorAll<HTMLElement>("[data-pill]")].map((p) => {
        const r = p.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });
    };
    const check = () => {
      timer = 0;
      let found = "";
      for (const [x, y] of points) {
        const under = document.elementsFromPoint(x, y).find((n) => !el.contains(n));
        const surface = under?.closest<HTMLElement>("[data-surface]")?.dataset.surface ?? "";
        if (overSurface[surface]) {
          found = overSurface[surface];
          break;
        }
      }
      if (found === current) return;
      current = found;
      if (found) el.style.setProperty("--pill-surface", found);
      else el.style.removeProperty("--pill-surface");
    };
    // A few checks a second are plenty (the colour change itself is a 0.5s fade).
    const onScroll = () => {
      if (!timer) timer = window.setTimeout(check, 90);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    measure();
    check();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  const links = [
    { href: href("/trabalhos"), label: t.nav.work },
    { href: href("/sobre"), label: t.nav.about },
    { href: href("/contato"), label: t.nav.contact },
  ];

  return (
    <header ref={header} className="site-header fixed inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between gap-2 px-4 py-4 md:px-12 md:py-6">
        <Link
          href={href("/")}
          data-pill
          className={`${pill} flex h-11 items-center px-4 font-display text-sm uppercase md:px-5`}
        >
          <span className="md:hidden">PH</span>
          <span className="hidden md:inline">Pedro Henrique</span>
        </Link>
        <div className="flex items-center gap-2">
          <ul
            data-pill
            className={`${pill} flex h-11 items-center gap-4 px-4 label text-[0.95rem] md:gap-8 md:px-6 md:text-base`}
          >
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative transition-opacity hover:opacity-100 ${active ? "opacity-100" : "opacity-55"}`}
                  >
                    {link.label}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-vermelho"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {/* Language switch: shows the language you can switch to. */}
          <Link
            href={swapLocale(pathname, other)}
            hrefLang={other}
            onClick={() => saveLangChoice(other)}
            aria-label={t.nav.switchLanguage}
            data-pill
            className={`${pill} flex h-11 w-11 items-center justify-center label text-[0.95rem] hover:border-vermelho/60`}
          >
            {other.toUpperCase()}
          </Link>
        </div>
      </nav>
    </header>
  );
}
