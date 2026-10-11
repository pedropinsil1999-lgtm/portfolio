"use client";

import { useRef } from "react";
import KineticGrid from "@/components/ui/kinetic-grid";
import HeroMegaphone from "@/components/HeroMegaphone";
import { useHeroReveal } from "@/lib/useHeroReveal";
import { useI18n } from "@/i18n/I18nProvider";

export default function HomeHero() {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  useHeroReveal(root);

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
            <span data-reveal className="block">Pedro</span>
          </span>
          <span className="block overflow-hidden whitespace-nowrap pb-[0.08em]">
            <span data-reveal className="block">Henrique</span>
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
