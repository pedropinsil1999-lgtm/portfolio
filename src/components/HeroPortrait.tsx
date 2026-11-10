"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Hero portrait: Pedro waving, framed in an arch with a thin outline around
 * it, and a little "hi" bubble. The name runs over its lower part.
 * - Rises into place once the intro clears; the bubble pops in after.
 * - As the hero scrolls away it drifts up a touch and fades before leaving.
 */
export default function HeroPortrait() {
  const root = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) return;
      gsap.set("[data-portrait]", { y: 50, autoAlpha: 0 });
      gsap.set("[data-hello]", { scale: 0.4, rotate: -24, autoAlpha: 0 });
      const play = contextSafe!(() =>
        gsap
          .timeline({ delay: 0.3 })
          .to("[data-portrait]", { y: 0, autoAlpha: 1, duration: 1.4, ease: "expo.out" }, 0)
          .to("[data-hello]", { scale: 1, rotate: -6, autoAlpha: 1, duration: 0.9, ease: "back.out(2.2)" }, 0.75),
      );

      const hero = root.current?.closest("section");
      gsap
        .timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
        .to("[data-portrait-drift]", { yPercent: -10, ease: "none", duration: 1 }, 0)
        // Gone before the hero has left, so it never reaches an edge.
        .to("[data-portrait-drift]", { opacity: 0, ease: "power1.in", duration: 0.4 }, 0.35);

      return whenIntroDone(play);
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      // Phones: in the flow, right above the name, which runs over its base.
      // Desktop: to the right of the name.
      className="pointer-events-none relative -mb-[16vw] ml-auto mr-1 w-[min(66vw,20rem)] md:absolute md:right-[6%] md:top-[15%] md:mb-0 md:mr-0 md:w-[clamp(15rem,26vw,25rem)]"
    >
      <div data-portrait-drift className="will-change-transform">
        <div data-portrait className="relative">
          {/* Thin outline a step outside the arch. */}
          <div className="rounded-t-full rounded-b-[2rem] border border-branco/25 p-2 md:p-2.5">
            <div className="relative aspect-[5/6] overflow-hidden rounded-t-full rounded-b-[1.6rem] bg-grafite">
              <Image
                src="/hero/pedro-graded.webp"
                alt="Pedro Henrique"
                fill
                priority
                sizes="(min-width: 768px) 26vw, 66vw"
                className="object-cover object-[50%_20%]"
              />
              {/* The light grey wall would read as a bright block on the navy page:
                  a vignette in the page navy lets it fall away around the face,
                  and the base darkens so the name reads over the photo. */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 62% 58% at 42% 34%, transparent 30%, rgb(4 42 65 / 0.55) 72%, rgb(4 42 65 / 0.9) 100%), linear-gradient(to top, rgb(4 42 65 / 0.85), transparent 45%)",
                }}
              />
            </div>
          </div>
          <span
            data-hello
            className="absolute right-[-6%] top-[16%] rounded-full bg-branco px-4 py-2 label text-[0.95rem] text-preto shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] md:text-base"
          >
            {t.hero.hello}
          </span>
        </div>
      </div>
    </div>
  );
}
