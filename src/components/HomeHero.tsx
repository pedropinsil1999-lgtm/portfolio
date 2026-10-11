"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { scriptGlow, scriptHidden, scriptRevealStyle, scriptSettle, scriptShown } from "@/lib/scriptReveal";
import { NOITE } from "@/components/ui/CardBackdrop";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { GRAIN } from "@/lib/grain";
import HeroMegaphone from "@/components/HeroMegaphone";
import { useHeroReveal } from "@/lib/useHeroReveal";
import { useI18n } from "@/i18n/I18nProvider";

const DIM = "#7298af"; // "Pedro" once "Henrique" is written

// Alpha threshold of the gooey filter: steep (blobs merge into one liquid
// shape), looser, then off (plain type).
const GOO_THICK = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -20";
const GOO_LOOSE = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8";
const GOO_NONE = "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0";

export default function HomeHero() {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  useHeroReveal(root);

  // Name entrance. "Pedro" condenses out of liquid: a gooey SVG filter (blur,
  // then an alpha threshold) melts the letters together and lets them set into
  // crisp type. Then "Henrique" is written in script over its base and
  // "Pedro" dims, so the script stays lit (same as the card titles).
  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) {
        gsap.set("[data-name-top]", { color: DIM });
        return;
      }
      const blur = document.querySelector("#hero-goo feGaussianBlur");
      const matrix = document.querySelector("#hero-goo feColorMatrix");
      gsap.set("[data-name-top]", { autoAlpha: 0 });
      gsap.set("[data-name-script]", scriptHidden);
      const play = contextSafe!(() =>
        gsap
          .timeline({ delay: 0.1 })
          .set("[data-name-top]", { filter: "url(#hero-goo)" }, 0)
          .set(blur ?? {}, { attr: { stdDeviation: 50 } }, 0)
          .set(matrix ?? {}, { attr: { values: GOO_THICK } }, 0)
          .to("[data-name-top]", { autoAlpha: 1, duration: 0.07, ease: "power1.out" }, 0.08)
          .to(blur ?? {}, { attr: { stdDeviation: 0 }, duration: 0.5, ease: "power2.out" }, 0.1)
          .to(matrix ?? {}, { attr: { values: GOO_LOOSE }, duration: 0.07, ease: "power1.out" }, 0.08)
          .to(matrix ?? {}, { attr: { values: GOO_NONE }, duration: 0.45, ease: "power1.inOut" }, 0.15)
          // Set: drop the filter so the title costs nothing afterwards.
          .set("[data-name-top]", { clearProps: "filter" }, 0.62)
          .to("[data-name-script]", {
            ...scriptShown,
            duration: 1.6,
            ease: "power2.out",
            onComplete() {
              scriptSettle(this.targets()[0] as Element, true);
            },
          }, 0.85)
          .to("[data-name-top]", { color: DIM, duration: 1.2, ease: "power1.inOut" }, 1.35),
      );
      return whenIntroDone(play);
    },
    { scope: root },
  );

  // Background: fades in with the page, and as the hero scrolls away it
  // drifts down, swells a touch and dissolves, so the next section rises out
  // of the plain page colour with no seam.
  const stage = useRef<HTMLDivElement>(null);
  // Once the background has dissolved (hero scrolled away) it stops animating.
  const [bgActive, setBgActive] = useState(true);
  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) return;
      // No fade-in: the background is already live behind the intro, so the
      // intro's opening window shows the lit page through it.
      void contextSafe;
      gsap.fromTo(
        "[data-hero-bg-inner]",
        { opacity: 1, scale: 1, yPercent: 0 },
        {
          opacity: 0,
          scale: 1.08,
          yPercent: 12,
          ease: "power1.in",
          scrollTrigger: {
            trigger: stage.current,
            start: "top top",
            end: "bottom 15%",
            scrub: true,
            onLeave: () => setBgActive(false),
            onEnterBack: () => setBgActive(true),
          },
        },
      );
    },
    { scope: stage },
  );

  return (
    <div ref={stage} className="relative overflow-x-clip">
      {/* Gooey filter for the name's liquid entrance (see the timeline above). */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="hero-goo" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0" />
          <feColorMatrix type="matrix" values={GOO_NONE} />
        </filter>
      </svg>
      <div
        data-hero-bg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        // Both edges dissolve into the page colour: no edge at rest, and the top
        // meets the iPhone status bar (tinted with the page colour) seamlessly.
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 16%, #000 50%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 16%, #000 50%, transparent 100%)",
        }}
      >
        <div data-hero-bg-inner className="absolute inset-0 origin-top will-change-transform">
          <MeshGradient {...NOITE} seed={3} active={bgActive} />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "160px 160px" }}
          />
        </div>
      </div>
      <section
        ref={root}
        data-theme="preto"
        className="relative flex min-h-svh flex-col overflow-x-clip justify-end px-6 pb-10 pt-32 md:px-12 md:pb-12"
      >
        <HeroMegaphone src="/hero/megafone.webp" />

        {/* On phones the kicker leads, above the megaphone. */}
        <div className="-order-1 mb-6 overflow-hidden md:order-none md:mb-0">
          <p data-reveal className="label text-[0.95rem] text-branco/60">
            {t.hero.kicker}
          </p>
        </div>

        <h1 className="mt-6 font-display text-[clamp(3.5rem,19vw,15rem)] leading-[0.88] text-branco md:text-[clamp(3.5rem,15vw,15rem)]">
          <span className="block pb-[0.08em]">
            <span data-name-top className="block">
              Pedro
            </span>
          </span>
          {/* Script, bigger, tucked up over the base of "Pedro". */}
          <span
            data-name-script
            style={scriptRevealStyle}
            className={`relative z-10 -mx-[0.25em] -mb-[0.2em] -mt-[0.5em] inline-block whitespace-nowrap px-[0.33em] pb-[0.3em] pl-[0.45em] pt-[0.3em] font-script text-[1.22em] font-normal md:text-[1.45em] leading-[0.9] tracking-normal ${scriptGlow}`}
          >
            Henrique
          </span>
        </h1>

        <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="overflow-hidden">
            <p data-reveal className="max-w-md text-lg leading-snug text-branco md:text-2xl">
              {t.hero.tagline}
            </p>
          </div>
          <div className="overflow-hidden">
            <p data-reveal className="label text-[0.95rem] text-branco/50">
              {t.hero.scroll}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
