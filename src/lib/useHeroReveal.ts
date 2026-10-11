"use client";

import type { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";

/** Masked rise for every `[data-reveal]` inside `scope`, timed after the intro. */
export function useHeroReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) return;
      gsap.set("[data-reveal]", { yPercent: 110 });
      const play = contextSafe!(() => {
        gsap.to("[data-reveal]", {
          yPercent: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          delay: 0.15,
        });
      });
      return whenIntroDone(play);
    },
    { scope },
  );
}
