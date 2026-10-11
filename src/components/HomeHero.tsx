"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { scriptGlow, scriptHidden, scriptRevealStyle, scriptShown } from "@/lib/scriptReveal";
import KineticGrid from "@/components/ui/kinetic-grid";
import HeroMegaphone from "@/components/HeroMegaphone";
import { useHeroReveal } from "@/lib/useHeroReveal";
import { useI18n } from "@/i18n/I18nProvider";

const DIM = "#7298af"; // "Pedro" once "Henrique" is written

export default function HomeHero() {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  useHeroReveal(root);

  // Same treatment as the card titles: "Pedro" rises, then "Henrique" is
  // written in script over its base and "Pedro" dims, so the script stays lit.
  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) {
        gsap.set("[data-name-top]", { color: DIM });
        return;
      }
      gsap.set("[data-name-script]", scriptHidden);
      const play = contextSafe!(() =>
        gsap
          .timeline({ delay: 0.75 })
          .to("[data-name-script]", { ...scriptShown, duration: 1.6, ease: "power2.out" })
          .to("[data-name-top]", { color: DIM, duration: 1.2, ease: "power1.inOut" }, 0.5),
      );
      return whenIntroDone(play);
    },
    { scope: root },
  );

  return (
    <KineticGrid>
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

        <h1 className="mt-6 font-display text-[clamp(3.5rem,15vw,15rem)] leading-[0.88] text-branco">
          <span className="block overflow-hidden pb-[0.08em]">
            <span data-reveal data-name-top className="block">
              Pedro
            </span>
          </span>
          {/* Script, bigger, tucked up over the base of "Pedro". */}
          <span
            data-name-script
            style={scriptRevealStyle}
            className={`relative z-10 -mx-[0.25em] -mb-[0.2em] -mt-[0.5em] inline-block whitespace-nowrap px-[0.33em] pb-[0.3em] pl-[0.45em] pt-[0.3em] font-script text-[1.45em] font-normal leading-[0.9] tracking-normal ${scriptGlow}`}
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
    </KineticGrid>
  );
}
