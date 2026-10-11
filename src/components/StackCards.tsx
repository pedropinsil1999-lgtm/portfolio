"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import CardPreview, { type Preview } from "@/components/CardPreview";
import HoverArrow from "@/components/ui/HoverArrow";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { GRAIN } from "@/lib/grain";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { scriptGlow, scriptHidden, scriptRevealStyle, scriptShown } from "@/lib/scriptReveal";

export type StackCard = {
  index: string;
  title: [string, string];
  text: string;
  tags: string[];
  tone: "grafite" | "branco";
  /** Optional preview of the related work and a link to it. */
  preview?: Preview;
  link?: { href: string; label: string };
};

// Card background: a dark mesh gradient ("Noite") that twists around the cursor.
const MESH = {
  colors: ["#021a29", "#042a41", "#004671", "#365c73"],
  intensity: 0.45,
  softness: 0.35,
  vignette: 0.35,
  cursor: true,
};

const DIM = "#7298af"; // the title's first word once the script word is written

const tones = {
  grafite: "border border-branco/10 bg-grafite text-branco",
  branco: "bg-branco text-preto",
};

/** Sticky cards that pile up like a deck; each one recedes out of focus as the next arrives. */
export default function StackCards({ cards }: { cards: StackCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  // Cards fully covered by the next one stop animating their background.
  const [covered, setCovered] = useState<boolean[]>(() => cards.map(() => false));

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-title-top]", { color: DIM });
        return;
      }
      const wrappers = gsap.utils.toArray<HTMLElement>("[data-card]");
      wrappers.forEach((wrapper, i) => {
        // The script word under the title is written in as the card arrives,
        // and the word above dims so only the script stays lit.
        gsap
          .timeline({ scrollTrigger: { trigger: wrapper, start: "top 65%", end: "top 20%", scrub: true } })
          .fromTo(wrapper.querySelector("[data-script]"), scriptHidden, { ...scriptShown, ease: "power1.out", duration: 1 })
          .to(wrapper.querySelector("[data-title-top]"), { color: DIM, ease: "none", duration: 0.6 }, 0.4);
        const next = wrappers[i + 1];
        if (!next) return;
        ScrollTrigger.create({
          trigger: next,
          start: "top 25%",
          endTrigger: document.documentElement,
          end: "bottom bottom",
          onToggle: (self) =>
            setCovered((prev) => (prev[i] === self.isActive ? prev : prev.map((v, k) => (k === i ? self.isActive : v)))),
        });
        // Rack focus: the card behind drifts slightly out of focus, not darker.
        gsap.fromTo(
          wrapper.firstElementChild,
          { scale: 1, filter: "blur(0px)" },
          {
            scale: 0.94,
            filter: "blur(3px)",
            ease: "none",
            // Finishes as the next card settles into its sticky slot.
            scrollTrigger: { trigger: next, start: "top 90%", end: "top 20%", scrub: true },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="flex flex-col gap-[12vh]">
      {cards.map((card, i) => (
        <div
          key={card.index}
          data-card
          className="sticky h-[82svh] md:h-[78svh]"
          style={{ top: `calc(6rem + ${i} * 0.75rem)` }}
        >
          <article
            data-surface={card.tone}
            className={`group/card relative isolate flex h-full origin-top flex-col overflow-hidden will-change-[transform,filter] rounded-[1.75rem] p-5 md:rounded-[2rem] md:p-12 ${tones[card.tone]}`}
          >
            {card.tone === "grafite" && (
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <MeshGradient {...MESH} seed={i + 1} active={!covered[i]} />
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "160px 160px" }}
                />
              </div>
            )}
            {/* Phones: index over a left-aligned line; desktop: side by side. */}
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-6">
              <span className="label text-base text-vermelho">{card.index}</span>
              <p className="max-w-[30ch] text-sm leading-snug opacity-70 md:max-w-xs md:text-right md:text-base md:leading-relaxed">
                {card.text}
              </p>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center py-4 md:justify-end md:py-6 md:pr-[16%]">
              {card.preview &&
                (card.link ? (
                  <Link
                    href={card.link.href}
                    tabIndex={-1}
                    aria-hidden="true"
                    data-cursor={card.link.label}
                  >
                    <CardPreview preview={card.preview} />
                  </Link>
                ) : (
                  <CardPreview preview={card.preview} />
                ))}
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6">
              <div>
                <h3 className="font-display text-[clamp(1.9rem,8.6vw,6.5rem)] leading-[0.95]">
                  <span data-title-top className="block">
                    {card.title[0]}
                  </span>
                  {/* Second word in script, bigger, tucked up over the bottom of the first. */}
                  <span
                    data-script
                    style={scriptRevealStyle}
                    className={`relative z-10 -mx-[0.25em] -mt-[0.62em] -mb-[0.3em] inline-block whitespace-nowrap px-[0.33em] pb-[0.3em] pl-[0.5em] pt-[0.3em] font-script text-[1.6em] font-normal leading-[0.9] tracking-normal text-branco ${scriptGlow}`}
                  >
                    {card.title[1]}
                  </span>
                </h3>
                <ul className="mt-5 flex flex-wrap gap-1.5 md:mt-8 md:gap-2">
                  {card.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-current/25 px-3 py-1 label text-[0.8rem] md:px-4 md:py-1.5 md:text-[0.95rem]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
              {card.link && (
                <Link
                  href={card.link.href}
                  className="group/arrow inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-branco px-5 py-2.5 label text-[0.9rem] md:px-6 md:py-3 md:text-[0.95rem] text-preto transition-colors hover:bg-vermelho hover:text-branco md:self-auto"
                >
                  {card.link.label}
                  <HoverArrow />
                </Link>
              )}
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
