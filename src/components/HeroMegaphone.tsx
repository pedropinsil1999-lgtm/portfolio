"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { filterAtRest } from "@/lib/scriptReveal";

/**
 * Hero object: a glossy megaphone resting at an angle over the name.
 * - Enters from below and out of focus once the intro clears.
 * - Rests tilted 4° (pivot at its bottom-left corner).
 * - While the hero scrolls away it swings on that pivot, drops a little and
 *   blurs and fades out, so it leaves like a camera losing focus.
 * Pass `src` (a transparent WebP/PNG render) to replace the drawn megaphone.
 */
export default function HeroMegaphone({ src }: { src?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) return;
      const enter = "[data-mega-enter]";
      gsap.set(enter, { y: 40, autoAlpha: 0, filter: "blur(22px)" });
      const play = contextSafe!(() =>
        gsap.to(enter, {
          y: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 1.6,
          ease: "expo.out",
          delay: 0.35,
          // A finished blur(0px) still costs a render pass; drop it.
          clearProps: "filter",
        }),
      );

      const hero = root.current?.closest("section");
      gsap
        .timeline({
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
          onUpdate() {
            filterAtRest(root.current?.querySelector("[data-mega-fade]") ?? null, this.progress() === 0);
          },
        })
        .to("[data-mega-scroll]", { rotate: 38, yPercent: 2, ease: "none", duration: 1 }, 0)
        .to("[data-mega-fade]", { filter: "blur(9px)", ease: "none", duration: 1 }, 0)
        // Gone before the hero has left, so it never reaches an edge.
        .to("[data-mega-fade]", { opacity: 0, ease: "power1.in", duration: 0.4 }, 0.35);

      return whenIntroDone(play);
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      // Phones: in the flow, right above the name and overlapping it a little,
      // so the object and the title read as one block. Desktop: floats to the
      // right of the name.
      className="pointer-events-none relative z-10 -mb-[9vw] -mr-[10vw] ml-auto w-[92vw] max-w-[28rem] md:absolute md:right-[5%] md:top-[14%] md:mb-0 md:ml-0 md:mr-0 md:w-[clamp(18rem,34vw,34rem)] md:max-w-none"
    >
      <div data-mega-enter>
        <div data-mega-fade className="will-change-[filter]">
          <div data-mega-scroll className="origin-bottom-left will-change-transform">
            <div className="origin-bottom-left rotate-[4deg] scale-[1.05] drop-shadow-[1.5rem_1.5rem_1rem_rgb(0_10_20_/_0.35)]">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" width={1098} height={1095} decoding="async" className="block h-auto w-full select-none" draggable={false} />
              ) : (
                <MegaphoneArt />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Drawn megaphone in the palette: ice-white shell, navy mouth, steel accents. */
function MegaphoneArt() {
  return (
    <svg viewBox="0 0 420 340" className="block h-auto w-full overflow-visible">
      <defs>
        <linearGradient id="mega-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#eaffff" />
          <stop offset="0.75" stopColor="#c2e8ff" />
          <stop offset="1" stopColor="#7298af" />
        </linearGradient>
        <linearGradient id="mega-shell-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#365c73" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#365c73" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mega-mouth" cx="0.42" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#004671" />
          <stop offset="0.7" stopColor="#042a41" />
          <stop offset="1" stopColor="#021a29" />
        </radialGradient>
        <linearGradient id="mega-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c2e8ff" />
          <stop offset="1" stopColor="#365c73" />
        </linearGradient>
        <linearGradient id="mega-grip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#365c73" />
          <stop offset="0.5" stopColor="#7298af" />
          <stop offset="1" stopColor="#365c73" />
        </linearGradient>
        <linearGradient id="mega-cap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7298af" />
          <stop offset="1" stopColor="#365c73" />
        </linearGradient>
      </defs>

      {/* Mouth points left, towards the name. */}
      <g className="mega-waves" fill="none" stroke="#7298af" strokeLinecap="round" strokeWidth="5">
        <path d="M40 120 Q22 170 40 220" />
        <path d="M18 95 Q-12 170 18 245" />
      </g>

      {/* Handle */}
      <path d="M262 196 L282 196 Q292 196 292 206 L300 292 Q301 306 287 306 L271 306 Q258 306 258 292 Z" fill="url(#mega-grip)" />
      {/* Trigger */}
      <path d="M248 204 Q240 230 252 246" fill="none" stroke="#365c73" strokeWidth="9" strokeLinecap="round" />

      {/* Back body (cylinder) */}
      <rect x="268" y="132" width="110" height="78" rx="14" fill="url(#mega-shell)" />
      <ellipse cx="378" cy="171" rx="16" ry="39" fill="url(#mega-cap)" />
      <ellipse cx="380" cy="171" rx="8" ry="26" fill="#042a41" opacity="0.35" />

      {/* Steel band where the bell meets the body */}
      <rect x="262" y="126" width="18" height="90" rx="6" fill="url(#mega-rim)" />

      {/* Bell (cone) */}
      <path d="M266 136 L96 44 A44 128 0 0 0 96 300 L266 208 Z" fill="url(#mega-shell)" />
      <path d="M266 136 L96 44 A44 128 0 0 0 96 300 L266 208 Z" fill="url(#mega-shell-side)" />
      {/* Gloss streak */}
      <path d="M250 142 L112 70" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
      <path d="M232 150 L150 106" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />

      {/* Mouth: rim and dark interior */}
      <ellipse cx="96" cy="172" rx="44" ry="128" fill="url(#mega-rim)" />
      <ellipse cx="99" cy="172" rx="35" ry="117" fill="url(#mega-mouth)" />
      <ellipse cx="112" cy="172" rx="9" ry="34" fill="#004671" opacity="0.8" />
    </svg>
  );
}
