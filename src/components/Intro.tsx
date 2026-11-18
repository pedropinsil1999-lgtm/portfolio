"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { releaseIntro } from "@/lib/motion";
import { LOGO_PATH } from "@/components/ui/Logo";
import { useI18n } from "@/i18n/I18nProvider";

const INK = "#010d14"; // the dark frame around the opening window

/**
 * Opening sequence, on every full page load (open or refresh), in the
 * visitor's own language (picked by the proxy from the browser).
 *
 * The PH mark draws itself as a thin outline, fills up from its base like
 * ink, and the name settles in below it. Then everything clears and an
 * aperture opens on the page: a small pill window in the middle of the dark
 * frame that grows to fill the screen, its rounded corners squaring off as it
 * lands. A click anywhere speeds the whole thing up.
 */
export default function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const { t } = useI18n();

  useGSAP(
    () => {
      const html = document.documentElement;
      if (html.dataset.intro !== "play") return;
      const q = gsap.utils.selector(root);

      const finish = () => {
        html.dataset.intro = "done";
        // The page was locked (no scrollbar) during the intro; now that the
        // scrollbar is back the layout is narrower, so re-measure scroll effects.
        requestAnimationFrame(() => ScrollTrigger.refresh());
      };

      const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
      const clamp = gsap.utils.clamp;
      const pillW = clamp(6 * rem, 8 * rem, window.innerWidth * 0.08);
      const pillH = clamp(3.25 * rem, 4 * rem, window.innerWidth * 0.041);
      const corner = clamp(1.75 * rem, 3.5 * rem, window.innerWidth * 0.04);
      const aperture = q("[data-intro-aperture]");

      timeline.current = gsap
        .timeline({ delay: 0.2 })
        // The mark: outline first, then the fill rising from the base.
        .to(q("[data-logo-stroke]"), { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" })
        .to(q("[data-logo-ink]"), { attr: { y: 0 }, duration: 0.8, ease: "expo.out" }, "-=0.3")
        .to(q("[data-logo-stroke]"), { opacity: 0, duration: 0.4 }, "<0.2")
        .to(q("[data-intro-label]"), { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "<0.1")
        // Clear, then open the window onto the page.
        .addLabel("clear", "+=0.45")
        .to(q("[data-intro-mark]"), { scale: 0.92, autoAlpha: 0, filter: "blur(10px)", duration: 0.45, ease: "power2.in" }, "clear")
        .to(q("[data-intro-label]"), { autoAlpha: 0, filter: "blur(8px)", duration: 0.35, ease: "power2.in" }, "clear")
        // The frame deepens to near-black "ink" so the window onto the page reads.
        .to(q("[data-intro-frame]"), { backgroundColor: INK, duration: 0.4, ease: "power1.inOut" }, "clear")
        .addLabel("open", "clear+=0.45")
        // Same colour, so swapping the frame for the ink layer is invisible.
        .set(q("[data-intro-frame]"), { autoAlpha: 0 }, "open")
        .set(aperture, { autoAlpha: 1, borderRadius: pillH / 2 }, "open")
        .to(aperture, { width: pillW, height: pillH, duration: 0.4, delay: 0.1, ease: "power4.out" }, "open")
        .addLabel("grow", "open+=0.55")
        // Measured in px (GSAP can't tween px into vw); a hair larger than the
        // screen so no sliver of the frame is left at the edges.
        .to(aperture, { width: () => window.innerWidth + 2, height: () => window.innerHeight + 2, duration: 1.25, ease: "power4.inOut" }, "grow")
        .to(aperture, { borderRadius: corner, duration: 0.85, ease: "power2.in" }, "grow")
        .to(aperture, { borderRadius: 0, duration: 0.4, ease: "power2.out" }, "grow+=0.85")
        // The hero starts its own entrance while the window is still growing.
        .call(releaseIntro, [], "grow+=0.75")
        .eventCallback("onComplete", finish);
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      onClick={() => timeline.current?.timeScale(3)}
      className="intro fixed inset-0 z-[100]"
    >
      <div data-intro-frame className="absolute inset-0 bg-preto" />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <svg
          data-intro-mark
          viewBox="-2 -2 104 104"
          className="h-[clamp(4.5rem,9vw,7rem)] w-[clamp(4.5rem,9vw,7rem)] overflow-visible text-branco"
        >
          <defs>
            <clipPath id="intro-ink">
              {/* Rises from the base (y 102 → 0) to fill the mark. */}
              <rect data-logo-ink x="-2" y="102" width="104" height="104" />
            </clipPath>
          </defs>
          <path d={LOGO_PATH} fill="currentColor" clipPath="url(#intro-ink)" />
          <path
            data-logo-stroke
            d={LOGO_PATH}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeDasharray="1"
            strokeDashoffset="1"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
        <p
          data-intro-label
          style={{ opacity: 0, visibility: "hidden", transform: "translateY(8px)" }}
          className="mt-6 label text-[0.95rem] text-branco/70"
        >
          {t.intro.label}
        </p>
      </div>

      {/* The aperture: a window with no size, its huge shadow is the dark frame
          ("ink") around it. GSAP grows it into a pill, then to the full screen. */}
      <div
        data-intro-aperture
        style={{ opacity: 0, visibility: "hidden" }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_150vmax_#010d14] will-change-[width,height,border-radius]"
      />
    </div>
  );
}
