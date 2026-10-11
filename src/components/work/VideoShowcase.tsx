"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";
import type { Video } from "@/content/work";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Vertical (9:16) audiovisual pieces, each paired with its description: the
 * frame on the left, the text on the right. Pairs sit side by side on wide
 * screens and stack on phones. Each frame is unmasked as it scrolls in; until
 * a file is set it shows a player placeholder.
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
    <div ref={root} className="mx-auto grid max-w-2xl gap-14 lg:max-w-none lg:grid-cols-2 lg:gap-10 xl:gap-16">
      {items.map((video, i) => (
        <article
          key={video.slug}
          className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-5 sm:gap-8"
        >
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
          {/* Description beside the frame: index and craft on top, the story below. */}
          <div className="flex min-w-0 flex-col justify-between py-1">
            <div>
              <span className="label text-[0.95rem] text-vermelho">{pad(i + 1)}</span>
              <p className="label mt-2 text-[0.85rem] text-fg/50 sm:text-[0.95rem]">{video.kind[lang]}</p>
            </div>
            <div>
              <h3 className="font-display text-xl leading-tight text-fg sm:text-2xl xl:text-3xl">{video.title[lang]}</h3>
              <div className="my-4 h-px w-10 bg-branco/20 sm:my-5" />
              <p className="text-sm leading-relaxed text-fg/70 sm:text-base">{video.about[lang]}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
