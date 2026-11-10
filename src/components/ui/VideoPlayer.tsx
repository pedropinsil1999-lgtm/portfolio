"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";

const PLAYING = "site-video:play";
const time = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/**
 * The site's own video player: the poster with one round play button, and
 * while it plays a thin bar (scrub it), the time, sound and fullscreen,
 * fading out when the pointer rests. Nothing loads until play; only one
 * video plays at a time and it pauses when scrolled out of view.
 * `silent` pieces play muted with no sound control.
 */
export default function VideoPlayer({
  src,
  poster,
  title,
  silent = false,
  className,
}: {
  src: string;
  poster?: string;
  title: string;
  silent?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(silent);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(0);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef(0);

  // Progress bar follows playback every frame, without re-rendering.
  useEffect(() => {
    const v = video.current;
    if (!v || !playing) return;
    let raf = 0;
    const tick = () => {
      if (fill.current && v.duration) fill.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // One at a time, and never playing off screen.
  useEffect(() => {
    const v = video.current;
    const el = box.current;
    if (!v || !el) return;
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== v) v.pause();
    };
    window.addEventListener(PLAYING, onOther);
    const io = new IntersectionObserver(([entry]) => !entry.isIntersecting && v.pause(), { threshold: 0.15 });
    io.observe(el);
    return () => {
      window.removeEventListener(PLAYING, onOther);
      io.disconnect();
    };
  }, []);

  const wake = () => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), 2200);
  };

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused || v.ended) {
      window.dispatchEvent(new CustomEvent(PLAYING, { detail: v }));
      setStarted(true);
      void v.play();
      wake();
    } else v.pause();
  };

  const seek = (e: ReactPointerEvent<HTMLDivElement>) => {
    const v = video.current;
    if (!v || !v.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    v.currentTime = p * v.duration;
    if (fill.current) fill.current.style.transform = `scaleX(${p})`;
    setNow(v.currentTime);
  };

  const fullscreen = () => {
    const el = box.current;
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el?.requestFullscreen) void el.requestFullscreen();
    else v?.webkitEnterFullscreen?.(); // iPhone: only the video itself can go fullscreen
  };

  const showBar = started && (!playing || !idle);
  const icon = "press flex h-9 w-9 items-center justify-center rounded-full text-branco/85 transition-colors hover:bg-branco/15 hover:text-branco";

  return (
    <div
      ref={box}
      className={cn("group/player relative overflow-hidden bg-preto", playing && idle && "cursor-none", className)}
      onPointerMove={playing ? wake : undefined}
    >
      <video
        ref={video}
        src={src}
        poster={poster}
        playsInline
        muted={muted}
        // Nothing downloads until play: the poster stands in.
        preload="none"
        aria-label={title}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Big play button over the poster (and whenever paused). */}
      <button
        type="button"
        onClick={toggle}
        aria-label={`Play: ${title}`}
        data-cursor="Play"
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
          playing ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-branco/40 bg-preto/35 transition-[transform,background-color] duration-500 ease-[var(--ease-cine)] group-hover/player:scale-110 group-hover/player:bg-preto/55 md:h-[4.5rem] md:w-[4.5rem]">
          <span className="ml-1 h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-branco" />
        </span>
      </button>

      {/* Controls: a soft shade at the bottom with the bar and the buttons. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-preto/80 to-transparent px-3 pb-3 pt-10 transition-opacity duration-500 md:px-4 md:pb-4",
          showBar ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          role="slider"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(now)}
          tabIndex={-1}
          className="group/bar relative -my-2 flex h-5 cursor-pointer items-center"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            seek(e);
          }}
          onPointerMove={(e) => e.buttons === 1 && seek(e)}
        >
          <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-branco/25 transition-[height] group-hover/bar:h-[5px]">
            <span ref={fill} className="absolute inset-0 origin-left scale-x-0 bg-vermelho" />
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className={icon}>
            {playing ? (
              <span className="flex gap-[3px]">
                <span className="h-3 w-[3px] rounded-full bg-current" />
                <span className="h-3 w-[3px] rounded-full bg-current" />
              </span>
            ) : (
              <span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-current" />
            )}
          </button>
          <span className="label ml-1 text-[0.8rem] tabular-nums text-branco/75">
            {time(now)} <span className="text-branco/40">/ {time(duration)}</span>
          </span>
          <span className="flex-1" />
          {!silent && (
            <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} className={icon}>
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
                {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
              </svg>
            </button>
          )}
          <button type="button" onClick={fullscreen} aria-label="Fullscreen" className={icon}>
            <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
