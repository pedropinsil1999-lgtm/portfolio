"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";
import type { Video } from "@/content/work";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Vertical (9:16) audiovisual pieces side by side. Each frame is unmasked as
 * it scrolls in; until a file is set it shows a player placeholder.
 */
export default function VideoShowcase({ items }: { items: Video[] }) {
  const { lang, t } = useI18n();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-video-frame]").forEach((frame) => {
        gsap.fromTo(
          frame,
          { clipPath: "inset(100% 0% 0% 0% round 1.25rem)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 1.25rem)",
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: frame, start: "top 88%", once: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:gap-8 md:gap-12">
      {items.map((video, i) => (
        <article key={video.slug}>
          <div
            data-video-frame
            className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] border border-branco/10 bg-grafite/40"
          >
            {video.src ? (
              <video
                src={video.src}
                poster={video.poster}
                controls
                playsInline
                preload="metadata"
                aria-label={video.title[lang]}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-branco/30 md:h-16 md:w-16">
                    <span className="ml-1 h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-branco" />
                  </span>
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 label text-sm text-branco/60 md:inset-x-5">
                  <span className="hidden sm:inline">00:00:{pad(i * 7 + 12)}</span>
                  <span className="relative h-px flex-1 overflow-hidden bg-branco/20">
                    <span className="reel-progress absolute inset-y-0 left-0 bg-vermelho" />
                  </span>
                  <span>{t.work.videoSoon}</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-5 flex items-baseline justify-between gap-4">
            <div>
              <p className="label text-[0.95rem] text-fg/50">{video.kind[lang]}</p>
              <h3 className="mt-2 font-display text-lg text-fg md:text-2xl">{video.title[lang]}</h3>
            </div>
            <span className="label text-[0.95rem] text-fg/40">{pad(i + 1)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
