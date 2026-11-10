"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * An Instagram carousel shown the way it is meant to be read: one slide after
 * the other with no gap between them, so the artwork that runs across the
 * slide edges reads as one continuous strip. Swiped (touch, trackpad) or
 * stepped with the arrows. Native
 * horizontal scroll with snapping, so it costs nothing while idle.
 */
export default function CaseCarousel({ slides, label }: { slides: string[]; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Follow the slide closest to the start of the track.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const first = el.firstElementChild as HTMLElement | null;
        if (!first) return;
        const step = first.offsetWidth; // slides touch: no gap
        setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / step))));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [slides.length]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    const target = el?.children[Math.max(0, Math.min(slides.length - 1, index + dir))] as HTMLElement | undefined;
    if (!el || !target) return;
    el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };

  const button =
    "flex h-11 w-11 items-center justify-center rounded-full border border-branco/20 text-branco transition-colors hover:bg-branco hover:text-preto disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-branco";

  return (
    <div>
      <div
        ref={track}
        className="-mx-6 flex snap-x snap-mandatory overflow-x-auto scroll-px-6 px-6 [scrollbar-width:none] md:-mx-12 md:scroll-px-12 md:px-12 [&::-webkit-scrollbar]:hidden"
        aria-label={label}
      >
        {slides.map((src, i) => (
          <div
            key={src}
            className={`relative aspect-[4/5] w-[min(78vw,26rem)] shrink-0 snap-start overflow-hidden bg-grafite ${i === 0 ? "rounded-l-[1.25rem]" : ""} ${i === slides.length - 1 ? "rounded-r-[1.25rem]" : ""}`}
          >
            <Image
              src={src}
              alt={`${label} ${i + 1}/${slides.length}`}
              fill
              sizes="(min-width: 768px) 26rem, 78vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={() => go(-1)} disabled={index === 0} className={button} aria-label="←">
          {"←︎"}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === slides.length - 1}
          className={button}
          aria-label="→"
        >
          {"→︎"}
        </button>
        <span className="label ml-2 text-[0.95rem] text-branco/50">
          <span className="text-vermelho">{pad(index + 1)}</span> / {pad(slides.length)}
        </span>
      </div>
    </div>
  );
}
