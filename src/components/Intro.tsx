"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { releaseIntro } from "@/lib/motion";
import { INTRO_RESUME_KEY } from "@/lib/introScript";
import { swapLocale, type Locale } from "@/i18n/config";
import { saveLangChoice, useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

// Each option speaks its own language, whatever the current URL is.
// Room around each word. The top word's descender (the g in Português) hangs
// towards the line, so it gets extra space below to sit as far from the line
// as the bottom word's capitals do.
const pad = { top: "pb-[0.5em] pt-[0.16em]", bottom: "pb-[0.26em] pt-[0.16em]" } as const;

const options: { lang: Locale; half: "top" | "bottom"; word: string; caption: string; enter: string; htmlLang: string }[] = [
  { lang: "pt", half: "top", word: "Português", caption: "Escolha seu idioma", enter: "Entrar", htmlLang: "pt-BR" },
  { lang: "en", half: "bottom", word: "English", caption: "Choose your language", enter: "Enter", htmlLang: "en" },
];

/**
 * Opening sequence. A thin cream line draws across the dark screen like a
 * projector gate, then the frame splits open onto the page.
 *
 * On every full page load (open or refresh), the two halves of that frame become
 * the language choice: "Português" rises above the line, "English" drops below
 * it. Hovering fills a word outward from the line and nudges the line toward
 * the other half; picking one opens the curtain, carrying the word with it.
 * If the pick differs from the current URL, the page reloads into that
 * language behind the closed curtain and reopens ("resume").
 */
export default function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const buttons = useRef<Partial<Record<Locale, HTMLButtonElement | null>>>({});
  const { lang, t } = useI18n();
  const [choosing, setChoosing] = useState(false);
  const [hover, setHover] = useState<Locale | null>(null);
  const [picked, setPicked] = useState<Locale | null>(null);

  const q = (selector: string) => gsap.utils.selector(root)(selector);

  const finish = () => {
    const html = document.documentElement;
    html.dataset.intro = "done";
    delete html.dataset.introChoose;
    // The page was locked (no scrollbar) during the intro; now that the
    // scrollbar is back the layout is narrower, so re-measure scroll effects.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  /** Appends the curtain opening to a timeline. */
  const addOpen = (tl: gsap.core.Timeline, at: string | number = ">") =>
    tl
      .addLabel("open", at)
      .to(q("[data-intro-top]"), { yPercent: -100, duration: 0.85, ease: "expo.inOut" }, "open")
      .to(q("[data-intro-bottom]"), { yPercent: 100, duration: 0.85, ease: "expo.inOut" }, "open")
      .to(q("[data-intro-line]"), { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "open")
      .call(releaseIntro, [], "open+=0.35")
      .eventCallback("onComplete", finish);

  useGSAP(
    () => {
      const html = document.documentElement;
      const mode = html.dataset.intro;
      if (mode !== "play" && mode !== "resume") return;

      if (mode === "resume") {
        gsap.set(q("[data-intro-line-bar]"), { scaleX: 1 });
        timeline.current = addOpen(gsap.timeline({ delay: 0.25 }));
        return;
      }

      const tl = gsap
        .timeline()
        .to(q("[data-intro-line-bar]"), { scaleX: 1, duration: 0.6, ease: "expo.inOut" });

      if (html.dataset.introChoose === "1") {
        tl.fromTo(
          q("[data-half='top'] [data-lang-word]"),
          { yPercent: 105, autoAlpha: 1 },
          { yPercent: 0, duration: 1, ease: "expo.out" },
          "-=0.1",
        )
          .fromTo(
            q("[data-half='bottom'] [data-lang-word]"),
            { yPercent: -105, autoAlpha: 1 },
            { yPercent: 0, duration: 1, ease: "expo.out" },
            "<0.08",
          )
          .to(q("[data-lang-caption]"), { autoAlpha: 1, duration: 0.5 }, "-=0.6")
          .call(() => {
            setChoosing(true);
            // Focus the dialog (not a word) so nothing looks pre-selected;
            // arrow keys / Tab then move between the two languages.
            root.current?.focus({ preventScroll: true });
          });
      } else {
        tl.to(q("[data-intro-label]"), { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, "-=0.2")
          .to(q("[data-intro-label]"), { autoAlpha: 0, duration: 0.2 }, "+=0.15");
        addOpen(tl);
      }
      timeline.current = tl;
    },
    { scope: root },
  );

  const pick = (choice: Locale) => {
    if (!choosing || picked) return;
    setPicked(choice);
    setHover(null);
    saveLangChoice(choice);

    const tl = gsap
      .timeline()
      .to(q(`[data-lang-option='${choice === "pt" ? "en" : "pt"}']`), { autoAlpha: 0, duration: 0.4 }, 0)
      .to(q("[data-lang-caption]"), { autoAlpha: 0, duration: 0.3 }, 0);

    if (choice === lang) {
      // Same language as the page: just open, the word rides out with its half.
      addOpen(tl, "+=0.35");
    } else {
      // Other language: tuck the word back into the line, then reload into
      // that language behind the closed curtain.
      tl.to(
        q(`[data-lang-option='${choice}'] [data-lang-word]`),
        { yPercent: choice === "pt" ? 105 : -105, duration: 0.6, ease: "expo.in" },
        "+=0.3",
      ).call(() => {
        try {
          sessionStorage.setItem(INTRO_RESUME_KEY, "1");
        } catch {}
        const { pathname, search, hash } = window.location;
        window.location.replace(swapLocale(pathname, choice) + search + hash);
      });
    }
    timeline.current = tl;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    buttons.current[e.key === "ArrowUp" ? "pt" : "en"]?.focus();
  };

  // The line leans away from the hovered language, giving its half more room.
  // The other word travels with the line so the line never touches it.
  const lineShift = hover === "pt" ? 14 : hover === "en" ? -14 : 0;
  const wordShift = (l: Locale) => (hover && hover !== l ? lineShift : 0);

  return (
    <div
      ref={root}
      role={choosing ? "dialog" : undefined}
      aria-modal={choosing || undefined}
      aria-label={choosing ? "Escolha seu idioma / Choose your language" : undefined}
      aria-hidden={choosing ? undefined : true}
      onClick={() => !choosing && !picked && timeline.current?.timeScale(3)}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="intro lang-chooser fixed inset-0 z-[100] outline-none"
      data-hover={hover ?? undefined}
    >
      {options.map((o) => (
        <div
          key={o.lang}
          data-intro-top={o.half === "top" || undefined}
          data-intro-bottom={o.half === "bottom" || undefined}
          className={cn("absolute inset-x-0 h-1/2 bg-preto", o.half === "top" ? "top-0" : "bottom-0")}
        >
          <p
            data-lang-caption
            lang={o.htmlLang}
            style={{ opacity: 0, visibility: "hidden" }}
            className={cn(
              "absolute label text-[0.95rem] text-branco/50",
              o.half === "top" ? "left-6 top-8 md:left-12 md:top-10" : "bottom-8 right-6 md:bottom-10 md:right-12",
            )}
          >
            {o.caption}
          </p>

          <div
            style={{ transform: `translateY(${wordShift(o.lang)}px)` }}
            className={cn(
              "absolute inset-x-0 flex justify-center overflow-hidden transition-transform duration-700 ease-[var(--ease-cine)]",
              o.half === "top" ? "bottom-0" : "top-0 pt-2 md:pt-3",
            )}
          >
            <button
              ref={(el) => {
                buttons.current[o.lang] = el;
              }}
              type="button"
              lang={o.htmlLang}
              tabIndex={choosing ? 0 : -1}
              data-lang-option={o.lang}
              data-half={o.half}
              data-picked={picked === o.lang || undefined}
              data-cursor={o.enter}
              onClick={() => pick(o.lang)}
              onMouseEnter={() => choosing && !picked && setHover(o.lang)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => choosing && !picked && setHover(o.lang)}
              onBlur={() => setHover(null)}
              className="lang-option rounded-xl px-2 outline-none"
            >
              <span
                data-lang-word
                style={{ opacity: 0, visibility: "hidden" }}
                className={cn(
                  "relative block font-display text-[clamp(2.75rem,11vw,10rem)] leading-[0.9]",
                  pad[o.half],
                )}
              >
                <span className="lang-word">{o.word}</span>
                <span aria-hidden="true" className={cn("lang-fill absolute inset-0", pad[o.half])}>
                  {o.word}
                </span>
              </span>
            </button>
          </div>
        </div>
      ))}

      {/* The horizon line: outer element leans on hover, inner bar is drawn by GSAP. */}
      <div
        data-intro-line
        className="pointer-events-none absolute inset-x-0 top-1/2 transition-transform duration-700 ease-[var(--ease-cine)]"
        style={{ transform: `translateY(${lineShift}px)` }}
      >
        <div data-intro-line-bar style={{ transform: "scaleX(0)" }} className="h-px bg-vermelho" />
      </div>

      <p
        data-intro-label
        style={{ opacity: 0, visibility: "hidden", transform: "translateY(8px)" }}
        className="pointer-events-none absolute inset-x-0 top-1/2 mt-5 text-center label text-[0.95rem] text-branco/70"
      >
        {t.intro.label}
      </p>
    </div>
  );
}
