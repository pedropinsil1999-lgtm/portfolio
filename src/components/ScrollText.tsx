"use client";

import { Fragment, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { scriptGlow, scriptHidden, scriptRevealStyle, scriptShown } from "@/lib/scriptReveal";

const DIM = "#365c73"; // the sentence once the highlight takes over

/**
 * A statement whose words light up one by one as it scrolls through the
 * viewport. An optional `highlight` closes it in script: it starts faded out,
 * is "written" left to right after the last word, and then the rest of the
 * sentence dims so only the highlight stays lit.
 */
export default function ScrollText({
  text,
  highlight,
  className,
}: {
  text: string;
  highlight?: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        if (highlight) gsap.set("[data-word]", { color: DIM });
        return;
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 35%", scrub: true },
      });
      tl.fromTo("[data-word]", { opacity: 0.15 }, { opacity: 1, ease: "none", stagger: 0.1, duration: 0.3 });
      if (highlight) {
        tl.fromTo(
          "[data-highlight]",
          scriptHidden,
          { ...scriptShown, ease: "power1.out", duration: 1.2 },
        ).to("[data-word]", { color: DIM, ease: "none", duration: 0.8 }, "-=0.5");
      }
    },
    { scope: ref, dependencies: [text, highlight] },
  );

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span data-word>{word}</span>
          {(i < words.length - 1 || highlight) && " "}
        </Fragment>
      ))}
      {highlight && (
        <span
          data-highlight
          // Padding (cancelled by negative margins) gives the mask room for the
          // swashes and glow that spill past the letters.
          style={scriptRevealStyle}
          className={`-mx-[0.25em] -my-[0.3em] inline-block whitespace-nowrap px-[0.33em] py-[0.3em] align-baseline font-script text-[1.9em] leading-[0.7] tracking-normal text-branco ${scriptGlow}`}
        >
          {highlight}
        </span>
      )}
    </p>
  );
}
