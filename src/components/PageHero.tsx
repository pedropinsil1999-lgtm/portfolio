"use client";

import { useRef, type ReactNode } from "react";
import { useHeroReveal } from "@/lib/useHeroReveal";
import { useI18n } from "@/i18n/I18nProvider";

// Top fades into the page colour, which also tints the iPhone status bar. A
// colour fade on top, not a mask (a mask over a moving background costs an
// extra GPU pass every frame).
const TOP_FADE = "linear-gradient(to bottom, var(--page-bg), transparent 16%)";

/**
 * Opening frame of the inner pages: title at the bottom, the space above it
 * for a page-specific piece (`children`, e.g. the proof stack on Work), and
 * an optional ambient `background` layer behind everything.
 */
export default function PageHero({
  page,
  children,
  background,
}: {
  page: "work" | "about" | "contact";
  children?: ReactNode;
  background?: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const { t } = useI18n();
  const { index, title, note } = t.pages[page];
  useHeroReveal(root);

  return (
    <section
      ref={root}
      data-theme="preto"
      className="relative isolate flex min-h-svh flex-col px-6 pb-16 pt-28 md:px-12 md:pb-24 md:pt-32"
    >
      {background && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {background}
          <div className="absolute inset-0" style={{ background: TOP_FADE }} />
        </div>
      )}
      <div className="relative flex min-h-[38svh] flex-1 items-center">{children}</div>

      <div className="overflow-hidden">
        <p data-reveal className="mb-6 label text-[0.95rem] text-branco/60">
          {index}
        </p>
      </div>
      <div className="overflow-hidden">
        <h1
          data-reveal
          className="pb-[0.12em] font-display text-[clamp(3rem,12vw,11rem)] leading-[0.9] text-branco"
        >
          {title}
        </h1>
      </div>
      <div className="overflow-hidden">
        <p data-reveal className="mt-8 max-w-sm text-sm text-branco/60">
          {note}
        </p>
      </div>
    </section>
  );
}
