"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

const R = 240; // light radius (px)
const DOTS = "radial-gradient(rgb(194 232 255 / 0.32) 1px, transparent 1.4px)";
const STEP = 22; // dot grid spacing (px)
const SOFT = `radial-gradient(${R}px circle at center, #000 0%, rgb(0 0 0 / 0.5) 45%, transparent 100%)`;

/**
 * Contact page background: a dot texture hidden in the dark that only shows
 * inside a soft circle of light following the cursor, like a flashlight. On
 * touch screens (no cursor) the light drifts slowly by itself.
 *
 * The light is a small element carrying the dots and a fixed soft mask; it
 * moves with a transform and shifts its dots the other way so they stay put
 * on the page. Only that small circle repaints, never the whole screen.
 */
export default function Flashlight() {
  const box = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = box.current;
    const el = spot.current;
    if (!root || !el) return;

    const pos = { x: -2 * R, y: -2 * R };
    const apply = () => {
      el.style.transform = `translate3d(${pos.x - R}px, ${pos.y - R}px, 0)`;
      // Dots counter-shifted so they stay fixed relative to the page.
      el.style.backgroundPosition = `${-((pos.x - R) % STEP)}px ${-((pos.y - R) % STEP)}px`;
    };
    apply();

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = prefersReducedMotion();
    let rect = root.getBoundingClientRect();
    let rectStale = false;
    let inView = true;
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      rectStale = true;
    });
    io.observe(root);

    if (fine) {
      const duration = reduced ? 0 : 0.6;
      const xTo = gsap.quickTo(pos, "x", { duration, ease: "power3.out", onUpdate: apply });
      const yTo = gsap.quickTo(pos, "y", { duration, ease: "power3.out", onUpdate: apply });
      const onMove = (e: PointerEvent) => {
        if (!inView) return;
        if (rectStale) {
          rect = root.getBoundingClientRect();
          rectStale = false;
        }
        xTo(e.clientX - rect.left);
        yTo(e.clientY - rect.top);
      };
      const onScroll = () => {
        rectStale = true;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll);
        gsap.killTweensOf(pos);
      };
    }

    if (reduced) {
      pos.x = rect.width * 0.7;
      pos.y = rect.height * 0.35;
      apply();
      return () => io.disconnect();
    }

    // Touch: a slow wandering beam (skipped while off screen).
    const tick = (time: number) => {
      if (!inView) return;
      pos.x = rect.width * (0.5 + 0.35 * Math.sin(time * 0.35));
      pos.y = rect.height * (0.4 + 0.25 * Math.sin(time * 0.23 + 1));
      apply();
    };
    const ro = new ResizeObserver(() => {
      rect = root.getBoundingClientRect();
    });
    ro.observe(root);
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div ref={box} className="absolute inset-0 overflow-hidden">
      <div
        ref={spot}
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: 2 * R,
          height: 2 * R,
          backgroundImage: DOTS,
          backgroundSize: `${STEP}px ${STEP}px`,
          maskImage: SOFT,
          WebkitMaskImage: SOFT,
        }}
      />
    </div>
  );
}
