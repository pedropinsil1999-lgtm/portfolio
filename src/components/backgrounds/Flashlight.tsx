"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Contact page background: a dot texture hidden in the dark that only shows
 * inside a soft circle of light following the cursor, like a flashlight. On
 * touch screens (no cursor) the light drifts slowly by itself.
 */
export default function Flashlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (x: number, y: number) => {
      el.style.setProperty("--lx", `${x}px`);
      el.style.setProperty("--ly", `${y}px`);
    };
    const light = { x: -400, y: -400 };
    set(light.x, light.y);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = prefersReducedMotion();

    if (fine) {
      const duration = reduced ? 0 : 0.6;
      const xTo = gsap.quickTo(light, "x", { duration, ease: "power3.out", onUpdate: () => set(light.x, light.y) });
      const yTo = gsap.quickTo(light, "y", { duration, ease: "power3.out", onUpdate: () => set(light.x, light.y) });
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo(e.clientX - r.left);
        yTo(e.clientY - r.top);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => window.removeEventListener("pointermove", onMove);
    }

    if (reduced) {
      const r = el.getBoundingClientRect();
      set(r.width * 0.7, r.height * 0.35);
      return;
    }
    // Touch: a slow wandering beam.
    const tick = (time: number) => {
      const r = el.getBoundingClientRect();
      const t = time / 1000;
      set(r.width * (0.5 + 0.35 * Math.sin(t * 0.35)), r.height * (0.4 + 0.25 * Math.sin(t * 0.23 + 1)));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{
        backgroundImage: "radial-gradient(rgb(194 232 255 / 0.32) 1px, transparent 1.4px)",
        backgroundSize: "22px 22px",
        maskImage: "radial-gradient(240px circle at var(--lx) var(--ly), #000 0%, rgb(0 0 0 / 0.5) 45%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(240px circle at var(--lx) var(--ly), #000 0%, rgb(0 0 0 / 0.5) 45%, transparent 100%)",
      }}
    />
  );
}
