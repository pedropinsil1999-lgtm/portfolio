"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

// Milestone dates as decimal years (month / 12), in dictionary order.
const AT = [2022, 2023.92, 2025.08, 2025.17, 2025.25, 2025.33, 2028.92];
const LAST = AT.length - 1;

/** Evenly spaced markers (2025 is crowded); "now" interpolates inside its gap. */
const markerPos = (i: number) => (i / LAST) * 100;
function nowPos(t: number) {
  if (t <= AT[0]) return 0;
  if (t >= AT[LAST]) return 100;
  const k = AT.findIndex((a, i) => t >= a && t < AT[i + 1]);
  return ((k + (t - AT[k]) / (AT[k + 1] - AT[k])) / LAST) * 100;
}
const currentYear = () => {
  const d = new Date();
  return d.getFullYear() + d.getMonth() / 12;
};

type Active = number | "now";

const noSubscribe = () => () => {};

/**
 * Career as an editing timeline. Milestones are markers on the track; the red
 * dot is the playhead. On load it plays through every marker and parks at
 * "now"; hovering or focusing a marker scrubs to it, and a single caption
 * below (like a subtitle) shows where the playhead is.
 */
export default function Timeline() {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const [active, setActive] = useState<Active>("now");
  const autoplay = useRef<gsap.core.Timeline | null>(null);

  // "Now" only exists in the browser: null while prerendering, then today.
  const now = useSyncExternalStore(
    noSubscribe,
    () => nowPos(currentYear()),
    () => null,
  );

  const target = active === "now" ? (now ?? 0) : markerPos(active);

  // Playhead glides to whatever is active.
  useGSAP(
    () => {
      if (now === null) return;
      gsap.to("[data-playhead]", {
        left: `${target}%`,
        duration: prefersReducedMotion() ? 0 : 0.6,
        ease: "expo.out",
        overwrite: true,
      });
    },
    { scope: root, dependencies: [target, now] },
  );

  // Opening: draw the track, then play through the milestones up to "now".
  useGSAP(
    () => {
      if (now === null || prefersReducedMotion()) return;
      const past = AT.filter((a) => a <= currentYear()).length;
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("[data-track]", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" })
        .fromTo(
          "[data-marker]",
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.08 },
          0.3,
        );
      for (let i = 0; i < past; i++) tl.call(() => setActive(i), [], 1 + i * 0.32);
      tl.call(() => setActive("now"), [], 1 + past * 0.32 + 0.2);
      autoplay.current = tl;
      return whenIntroDone(() => tl.delay(0.3).play());
    },
    { scope: root, dependencies: [now] },
  );

  // Any manual scrub stops the autoplay.
  const scrub = (a: Active) => {
    autoplay.current?.progress(1).kill();
    autoplay.current = null;
    setActive(a);
  };

  const caption =
    active === "now"
      ? { date: t.about.now, text: t.about.nowText, red: true }
      : { ...t.about.milestones[active], red: false };

  return (
    <div ref={root} className="w-full">
      {/* Desktop / tablet: editing timeline */}
      <div className="hidden md:block" onMouseLeave={() => scrub("now")}>
        <div className="relative h-16">
          {/* Track: solid past, dashed future */}
          <div data-track className="absolute inset-x-0 bottom-0 h-px origin-left">
            <div className="absolute inset-y-0 left-0 bg-branco" style={{ width: `${now ?? 0}%` }} />
            <div
              className="absolute top-0 border-t border-dashed border-branco/35"
              style={{ left: `${now ?? 0}%`, right: 0 }}
            />
          </div>

          {t.about.milestones.map((m, i) => {
            const isActive = active === i;
            const edge = i === 0 ? "left" : i === LAST ? "right" : "center";
            return (
              <button
                key={m.date}
                type="button"
                data-marker
                aria-label={`${m.date}: ${m.text}`}
                onMouseEnter={() => scrub(i)}
                onFocus={() => scrub(i)}
                onBlur={() => scrub("now")}
                className="group/marker absolute bottom-0 h-16 w-20 -translate-x-1/2 outline-none"
                style={{ left: `${markerPos(i)}%` }}
              >
                <span
                  className={cn(
                    "absolute bottom-5 whitespace-nowrap font-display text-sm transition-colors duration-300 lg:text-base",
                    edge === "left" ? "left-1/2" : edge === "right" ? "right-1/2" : "left-1/2 -translate-x-1/2",
                    isActive ? "text-branco" : "text-branco/45 group-hover/marker:text-branco",
                  )}
                >
                  {m.date}
                </span>
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full transition-transform duration-300",
                    now !== null && markerPos(i) <= now ? "bg-branco" : "border border-branco/60 bg-preto",
                    isActive && "scale-150",
                  )}
                />
              </button>
            );
          })}

          {/* Playhead */}
          <span
            data-playhead
            aria-hidden="true"
            className="now-pulse pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-vermelho"
          />
        </div>

        {/* Caption, like a subtitle under the track */}
        <div className="mt-10 min-h-24" aria-live="polite">
          <p
            key={`${caption.date}-d`}
            className={cn(
              "caption-in label text-[0.95rem]",
              caption.red ? "text-vermelho" : "text-branco/50",
            )}
          >
            {caption.date}
          </p>
          <p key={`${caption.date}-t`} className="caption-in mt-3 max-w-2xl font-display text-2xl leading-tight text-branco lg:text-3xl">
            {caption.text}
          </p>
        </div>
      </div>

      {/* Mobile: vertical list with every milestone */}
      <ol className="relative mb-12 ml-1 border-l border-branco/25 md:hidden">
        {t.about.milestones.map((m, i) => (
          <li key={m.date} className="relative pb-5 pl-6 last:pb-0">
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-branco" />
            <p className="font-display text-base text-branco">{m.date}</p>
            <p className="mt-1 text-sm text-branco/60">{m.text}</p>
            {i === 5 && (
              <p className="mt-4 flex items-center gap-3 label text-[0.95rem] text-vermelho">
                <span className="now-pulse -ml-[30px] h-3 w-3 rounded-full bg-vermelho" />
                {t.about.now}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
