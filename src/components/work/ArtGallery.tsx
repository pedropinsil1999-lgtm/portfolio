"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useLenis } from "@/components/SmoothScroll";
import { useI18n } from "@/i18n/I18nProvider";
import type { Art } from "@/content/work";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Editorial grid of visual pieces. Each card is unmasked as it scrolls in;
 * clicking opens a full-screen viewer (arrows to browse, Esc to close).
 */
export default function ArtGallery({ items }: { items: Art[] }) {
  const { lang, t } = useI18n();
  const grid = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-art-frame]").forEach((frame) => {
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
    { scope: grid },
  );

  const close = useCallback(() => {
    setOpen((current) => {
      if (current !== null) triggers.current[current]?.focus({ preventScroll: true });
      return null;
    });
  }, []);

  return (
    <>
      <div
        ref={grid}
        className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-8"
      >
        {items.map((art, i) => (
          <button
            key={art.slug}
            ref={(el) => {
              triggers.current[i] = el;
            }}
            type="button"
            data-cursor={t.work.view}
            onClick={() => setOpen(i)}
            className="group text-left"
          >
            <div data-art-frame className="overflow-hidden rounded-[0.9rem] bg-grafite sm:rounded-[1.25rem]">
              <Image
                src={art.src}
                alt={`${art.title} | ${art.kind[lang]}`}
                width={1080}
                height={1350}
                sizes="(min-width: 1024px) 30vw, 48vw"
                className="aspect-[4/5] h-auto w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-cine)] group-hover:scale-[1.04]"
              />
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2 sm:mt-5 sm:gap-4">
              <div className="min-w-0">
                <p className="label text-[0.75rem] text-fg/50 sm:text-[0.95rem]">{art.kind[lang]}</p>
                <h3 className="mt-1 font-display text-base leading-tight text-fg sm:mt-2 sm:text-xl md:text-2xl">{art.title}</h3>
              </div>
              <span className="label hidden text-[0.95rem] text-fg/40 sm:inline">{pad(i + 1)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Portalled to <body>: inside the page it would be trapped in the page
          layer and the fixed header would sit on top of it. */}
      {open !== null &&
        createPortal(<Viewer items={items} index={open} onIndex={setOpen} onClose={close} />, document.body)}
    </>
  );
}

function Viewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: Art[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const lenis = useLenis();
  const closeButton = useRef<HTMLButtonElement>(null);
  const art = items[index];
  const go = useCallback(
    (step: number) => onIndex((index + step + items.length) % items.length),
    [index, items.length, onIndex],
  );

  // Freeze the page behind the viewer and wire the keyboard.
  useEffect(() => {
    const smooth = lenis?.current;
    smooth?.stop();
    document.documentElement.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      smooth?.start();
      document.documentElement.style.overflow = "";
    };
  }, [lenis]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const pill =
    "flex h-11 items-center justify-center rounded-full bg-branco/10 px-5 label text-[0.95rem] text-branco backdrop-blur-md transition-colors hover:bg-branco/20";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={art.title}
      // Scrolls as a column on phones (piece, then its text); fixed frame on desktop.
      data-lenis-prevent
      className="viewer fixed inset-0 z-[90] flex flex-col overflow-y-auto bg-preto/92 px-4 py-4 backdrop-blur-xl md:px-12 md:py-6 lg:overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between">
        <span className="label text-[0.95rem] text-branco/50">
          {pad(index + 1)} / {pad(items.length)}
        </span>
        <button ref={closeButton} type="button" onClick={onClose} className={pill}>
          {t.work.viewer.close} {"✕\uFE0E"}
        </button>
      </div>

      <div className="flex flex-col gap-8 py-6 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-center lg:gap-16">
        <div className="flex min-h-0 items-center justify-center lg:h-full" onClick={onClose}>
          <Image
            key={art.slug}
            src={art.src}
            alt={`${art.title} | ${art.kind[lang]}`}
            width={1080}
            height={1350}
            sizes="(min-width: 768px) 60vh, 90vw"
            priority
            onClick={(e) => e.stopPropagation()}
            className="viewer-image h-auto max-h-[62svh] w-auto max-w-full rounded-[1rem] object-contain lg:h-full lg:max-h-full"
          />
        </div>

        {/* The piece explained: what it is, for whom, and the thinking behind it. */}
        <div key={art.slug} className="caption-in max-w-xl lg:pr-4">
          <p className="label text-[0.95rem] text-branco/50">{art.kind[lang]}</p>
          <p className="mt-2 font-display text-3xl leading-tight text-branco md:text-4xl">{art.title}</p>
          <p className="label mt-3 text-[0.95rem] text-vermelho">{art.client[lang]}</p>
          <div className="mt-6 h-px w-12 bg-branco/20" />
          <p className="mt-6 text-base leading-relaxed text-branco/75 md:text-lg">{art.about[lang]}</p>
        </div>
      </div>

      <div className="sticky bottom-0 flex items-end justify-end gap-6">
        <div className="flex gap-2">
          <button type="button" onClick={() => go(-1)} aria-label={t.work.viewer.prev} className={pill}>
            {"←\uFE0E"}
          </button>
          <button type="button" onClick={() => go(1)} aria-label={t.work.viewer.next} className={pill}>
            {"→\uFE0E"}
          </button>
        </div>
      </div>
    </div>
  );
}
