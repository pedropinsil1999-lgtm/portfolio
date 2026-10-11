"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";

// The render with its drop shadow baked in, plus a soft (blurred) copy of the
// same frame. Focus changes are a cross-fade between the two: no CSS blur or
// drop-shadow filter is ever computed live, which phones struggle with.
const SHARP = "/hero/megafone-hero.webp";
const SOFT = "/hero/megafone-hero-blur.webp";
// The baked frame has room for the shadow around the 1098×1095 render:
// 40px left/top and 120px right/bottom, i.e. 1258×1255 in all.
const FRAME = { left: "-3.643%", top: "-3.653%", width: "114.572%", height: "114.612%" };

/**
 * Hero object: a glossy megaphone resting at an angle over the name.
 * - Enters from below and out of focus once the intro clears.
 * - Rests tilted 4° (pivot at its bottom-left corner).
 * - While the hero scrolls away it swings on that pivot, drops a little and
 *   goes out of focus and fades, so it leaves like a camera losing focus.
 */
export default function HeroMegaphone() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) return;
      // Entry and scroll each drive their own layers, so scrolling during
      // the entry can't leave a layer stuck half way.
      gsap.set("[data-mega-enter]", { y: 40, autoAlpha: 0 });
      // Own GPU layers only while the entry runs (opacity then costs no repaint).
      gsap.set("[data-mega-enter-sharp]", { opacity: 0, willChange: "opacity" });
      gsap.set("[data-mega-enter-soft]", { opacity: 1, willChange: "opacity" });
      const play = contextSafe!(() =>
        gsap
          .timeline({
            delay: 0.35,
            defaults: { duration: 1.6, ease: "expo.out" },
            onComplete: () => {
              gsap.set("[data-mega-enter-soft]", { display: "none" });
              gsap.set("[data-mega-enter-sharp]", { willChange: "auto" });
            },
          })
          .to("[data-mega-enter]", { y: 0, autoAlpha: 1 }, 0)
          .to("[data-mega-enter-sharp]", { opacity: 1 }, 0.1)
          .to("[data-mega-enter-soft]", { opacity: 0 }, 0.3),
      );

      const hero = root.current?.closest("section");
      gsap
        .timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
        .to("[data-mega-scroll]", { rotate: 38, yPercent: 2, ease: "none", duration: 1 }, 0)
        // Out of focus: the soft copy comes up as the sharp one goes.
        .fromTo("[data-mega-soft]", { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.25 }, 0)
        .fromTo("[data-mega-sharp]", { opacity: 1 }, { opacity: 0, ease: "none", duration: 0.25 }, 0.12)
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
        <div data-mega-fade>
          <div data-mega-scroll className="origin-bottom-left will-change-transform">
            <div className="relative aspect-[1098/1095] origin-bottom-left rotate-[4deg] scale-[1.05]">
              <Frame soft data-mega-soft />
              <div data-mega-sharp className="absolute inset-0 will-change-[opacity]">
                <div data-mega-enter-sharp className="absolute inset-0">
                  <Frame />
                </div>
              </div>
              <Frame soft data-mega-enter-soft />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One frame of the megaphone (sharp, or the soft copy, hidden until animated). */
function Frame({ soft, ...rest }: { soft?: boolean; "data-mega-soft"?: boolean; "data-mega-enter-soft"?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={soft ? SOFT : SHARP}
      alt=""
      width={soft ? 629 : 1258}
      height={soft ? 628 : 1255}
      decoding="async"
      fetchPriority={soft ? "low" : "high"}
      className={`absolute max-w-none select-none ${soft ? "opacity-0 will-change-[opacity]" : ""}`}
      style={FRAME}
      draggable={false}
    />
  );
}
