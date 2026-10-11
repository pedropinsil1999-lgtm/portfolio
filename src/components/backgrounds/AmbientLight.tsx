"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { GRAIN } from "@/lib/grain";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";


/**
 * About page background: a very soft light-blue glow resting in a corner. It
 * breathes slowly and drifts, unhurried, towards the cursor, like ambient
 * light in a room. No shapes, only atmosphere.
 */
export default function AmbientLight({
  anchor = { x: 0.18, y: 0.2 },
  pull = 0.55,
  size = "110vmax",
}: {
  /** Resting spot of the light (fraction of the frame); top-left by default. */
  anchor?: { x: number; y: number };
  /** How far towards the cursor the light leans (1 = all the way). */
  pull?: number;
  /** Diameter of the glow. */
  size?: string;
} = {}) {
  const root = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLCanvasElement>(null);

  // The glow is painted once into a tiny canvas and stretched by CSS: as its
  // own layer it costs a 128px texture instead of one the size of the screen.
  useEffect(() => {
    const ctx = disc.current?.getContext("2d");
    if (!ctx) return;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    const stops: [number, number][] = [
      [0, 0.17], [0.143, 0.14], [0.286, 0.1], [0.429, 0.066], [0.571, 0.038], [0.714, 0.018], [0.857, 0.006], [1, 0],
    ];
    stops.forEach(([at, a]) => g.addColorStop(at, `rgba(194, 232, 255, ${a})`));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }, []);

  useEffect(() => {
    const box = root.current;
    const el = glow.current;
    if (!box || !el) return;

    const reduced = prefersReducedMotion();
    let W = box.clientWidth;
    let H = box.clientHeight;
    // Centre the disc on the anchor; GSAP owns its transform (scale too).
    gsap.set(disc.current, { xPercent: -50, yPercent: -50 });
    const place = (x: number, y: number) => gsap.set(el, { x, y });
    place(W * anchor.x, H * anchor.y);

    const ro = new ResizeObserver(() => {
      W = box.clientWidth;
      H = box.clientHeight;
      if (reduced) place(W * anchor.x, H * anchor.y);
    });
    ro.observe(box);

    // Fade in once the intro has cleared.
    gsap.set(el, { autoAlpha: 0 });
    const undoIntro = whenIntroDone(() => {
      gsap.to(el, { autoAlpha: 1, duration: 2, delay: 0.2, ease: "power2.out" });
    });
    if (reduced) {
      return () => {
        ro.disconnect();
        undoIntro();
        gsap.killTweensOf(el);
      };
    }

    // Breathing: a slow swell in size and strength (paused off screen).
    const breath = gsap.to(disc.current, {
      scale: 1.12,
      opacity: 0.7,
      duration: 5,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Drift: long, soft easing so it follows rather than chases.
    const xTo = gsap.quickTo(el, "x", { duration: 2.6, ease: "power2.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 2.6, ease: "power2.out" });
    const lean = (x: number, y: number) => {
      xTo(W * anchor.x + (x - W * anchor.x) * pull);
      yTo(H * anchor.y + (y - H * anchor.y) * pull);
    };
    const rest = () => lean(W * anchor.x, H * anchor.y);

    // Keep the last viewport position so scrolling with a still mouse keeps
    // the light leaning towards it. The box's rect is cached and re-read at
    // most once per frame after a scroll.
    let last: { clientX: number; clientY: number } | null = null;
    let inView = true;
    let rect = box.getBoundingClientRect();
    let rectStale = false;
    const follow = () => {
      if (!inView) return;
      if (!last) return rest();
      if (rectStale) {
        rect = box.getBoundingClientRect();
        rectStale = false;
      }
      const r = rect;
      const x = last.clientX - r.left;
      const y = last.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return rest();
      lean(x, y);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = { clientX: e.clientX, clientY: e.clientY };
      follow();
    };
    const onLeave = () => {
      last = null;
      rest();
    };

    let scrollFrame = 0;
    const onScroll = () => {
      rectStale = true;
      if (!scrollFrame && inView) {
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          follow();
        });
      }
    };

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let wander: gsap.core.Tween | undefined;
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    } else {
      // Touch: no cursor, so the light wanders gently on its own.
      const drift = { t: 0 };
      wander = gsap.to(drift, {
        t: Math.PI * 2,
        duration: 40,
        ease: "none",
        repeat: -1,
        onUpdate: () => lean(W * (0.5 + 0.35 * Math.sin(drift.t)), H * (0.4 + 0.25 * Math.sin(drift.t * 2 + 1))),
      });
    }

    // Nothing animates while the light is off screen.
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      rectStale = true;
      if (inView) {
        breath.resume();
        wander?.resume();
      } else {
        breath.pause();
        wander?.pause();
      }
    });
    io.observe(box);

    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(scrollFrame);
      undoIntro();
      breath.kill();
      wander?.kill();
      gsap.killTweensOf(el);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [anchor.x, anchor.y, pull]);

  return (
    <div ref={root} className="absolute inset-0">
      {/* Anchored at its centre; GSAP moves it with x/y. */}
      <div ref={glow} className="absolute left-0 top-0 h-0 w-0">
        <canvas
          ref={disc}
          width={128}
          height={128}
          className="absolute will-change-transform"
          // The gradient spans 70% of the old disc, so the canvas is 70% of `size`.
          style={{ width: `calc(${size} * 0.7)`, height: `calc(${size} * 0.7)` }}
        />
      </div>
      {/* Fine grain dithers the gradient: a dark page shows 8-bit banding in
          soft light, and a whisper of noise dissolves the steps. */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "160px 160px" }}
      />
    </div>
  );
}
