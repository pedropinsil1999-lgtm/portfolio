"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import CardBackdrop from "@/components/ui/CardBackdrop";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale as Lang } from "@/i18n/config";

const versions: Record<
  Lang,
  {
    href: string;
    file: string;
    size: string;
    title: string;
    sections: string[];
  }
> = {
  pt: {
    href: "/cv/curriculo-pedro-henrique-pt.pdf",
    file: "Curriculo - Pedro Henrique Pinheiro Silva.pdf",
    size: "22 KB",
    title: "Designer e Comunicador",
    sections: ["Experiência", "Formação", "Habilidades"],
  },
  en: {
    href: "/cv/resume-pedro-henrique-en.pdf",
    file: "Resume - Pedro Henrique Pinheiro Silva.pdf",
    size: "21 KB",
    title: "Designer & Communicator",
    sections: ["Experience", "Education", "Skills"],
  },
};

const langs: Lang[] = ["pt", "en"];

/** Miniature of the CV page: real headings, abstract body lines. */
function Sheet({ lang }: { lang: Lang }) {
  const v = versions[lang];
  return (
    <div className="flex h-full flex-col gap-[6%] rounded-[0.9rem] bg-branco p-[9%] text-left text-grafite shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
      <div>
        <p className="font-display text-[0.8rem] leading-tight md:text-[0.95rem]">
          Pedro Henrique
          <br />
          Pinheiro Silva
        </p>
        <p className="mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.15em] opacity-60 md:text-[0.6rem]">
          {v.title}
        </p>
        <div className="mt-[8%] h-px bg-grafite/70" />
      </div>
      {v.sections.map((section, i) => (
        <div key={section} className="flex flex-col gap-[0.3rem]">
          <p className="text-[0.5rem] font-bold uppercase tracking-[0.2em] opacity-70 md:text-[0.55rem]">
            {section}
          </p>
          {Array.from({ length: i === 0 ? 4 : 2 }).map((_, j) => (
            <span
              key={j}
              className="h-[3px] rounded-full bg-grafite/15"
              style={{ width: `${92 - ((i + j) % 3) * 14}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * CV download with a language switch. Two paper sheets sit in a small stack;
 * picking a language shuffles that sheet to the front, and the button follows.
 */
export default function CvDownload() {
  const { t, lang: siteLang } = useI18n();
  const [lang, setLang] = useState<Lang>(siteLang);
  const download = useRef<HTMLAnchorElement>(null);
  const active = versions[lang];

  return (
    <section className="px-6 pt-16 md:px-12 md:pt-24">
      <div className="relative isolate grid items-center gap-14 overflow-hidden rounded-[2rem] border border-branco/12 p-6 md:grid-cols-[1fr_auto] md:gap-20 md:p-14">
        <CardBackdrop seed={7} />
        <div>
          <p className="label text-[0.95rem] text-branco/50">{t.cv.label}</p>
          <h2 className="mt-6 max-w-[16ch] font-display text-[clamp(1.9rem,4.2vw,3.6rem)] leading-[1.02] text-branco">
            {t.cv.title}
          </h2>

          <div
            role="radiogroup"
            aria-label={t.cv.group}
            className="relative mt-10 inline-grid grid-cols-2 rounded-full border border-branco/15 p-1"
          >
            {/* Sliding indicator behind the selected language */}
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-branco transition-transform duration-500 ease-[var(--ease-cine)]"
              style={{ transform: lang === "en" ? "translateX(100%)" : "translateX(0)" }}
            />
            {langs.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                onClick={() => setLang(l)}
                className={cn(
                  "relative z-10 rounded-full px-6 py-2.5 label text-base transition-colors duration-500",
                  lang === l ? "text-preto" : "text-branco/60 hover:text-branco",
                )}
              >
                {t.cv.versions[l].label}
              </button>
            ))}
          </div>

          {/* Stacked, so the meta line stays put when the button label changes length. */}
          <div className="mt-6 flex flex-col items-start gap-3">
            <a
              ref={download}
              href={active.href}
              download={active.file}
              className="group inline-flex items-center gap-3 rounded-full bg-branco px-7 py-4 label text-base text-preto transition-colors hover:bg-vermelho hover:text-branco"
            >
              {t.cv.versions[lang].cta}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
              >
                {"↓\uFE0E"}
              </span>
            </a>
            <span className="label text-[0.95rem] text-branco/40">
              {t.cv.meta} · {active.size}
            </span>
          </div>
        </div>

        {/* Paper stack: the selected sheet comes forward, the other recedes. */}
        <div className="relative mx-auto aspect-[1/1.414] w-[min(60vw,15rem)] md:w-[17rem]">
          {langs.map((l) => {
            const front = l === lang;
            return (
              <button
                key={l}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                // Front sheet downloads; the one behind swaps language.
                data-cursor={front ? t.cv.cursor : t.cv.versions[l].label}
                onClick={() => (front ? download.current?.click() : setLang(l))}
                className={cn(
                  "absolute inset-0 transition-all duration-700 ease-[var(--ease-cine)]",
                  front
                    ? "z-10 rotate-[-3deg] opacity-100 hover:-translate-y-2 hover:rotate-[-1.5deg]"
                    : "z-0 translate-x-[14%] -translate-y-[6%] rotate-[6deg] scale-[0.92] opacity-45 blur-[1.5px] hover:opacity-70",
                )}
              >
                <Sheet lang={l} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
