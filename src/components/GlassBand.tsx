"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const POINTS = 64; // samples along the tube

// Cross-section of a clear glass tube on the mint page, as strokes laid along
// the tube at an offset (-1 = top edge, 1 = bottom edge) of the radius. Edges
// darken (the glass is seen edge-on there), the body is barely tinted, light
// catches a sharp line near the top and a caustic glint near the bottom.
type Layer = { at: number; width: number; color: string; alpha: number; glint?: boolean };
const SHADOW: Layer[] = [2.6, 2.2, 1.8, 1.4].map((width) => ({ at: 0, width, color: "#1f6a5c", alpha: 0.045 }));
const GLASS: Layer[] = [
  { at: 0, width: 2, color: "#e8fff6", alpha: 0.22 },
  { at: 0.55, width: 0.5, color: "#2f8a78", alpha: 0.1 },
  { at: -0.88, width: 0.26, color: "#2f8a78", alpha: 0.32 },
  { at: 0.88, width: 0.26, color: "#2f8a78", alpha: 0.4 },
  { at: -0.985, width: 0.05, color: "#1f6a5c", alpha: 0.55 },
  { at: 0.985, width: 0.05, color: "#1f6a5c", alpha: 0.6 },
  { at: -0.38, width: 0.55, color: "#ffffff", alpha: 0.2 },
  { at: -0.56, width: 0.15, color: "#ffffff", alpha: 0.95, glint: true },
  { at: -0.74, width: 0.05, color: "#ffffff", alpha: 0.65, glint: true },
  { at: 0.7, width: 0.08, color: "#ffffff", alpha: 0.6, glint: true },
  { at: 0.32, width: 0.04, color: "#ffffff", alpha: 0.3 },
];

/**
 * The identity's glass strip: a clear glass tube waving across the page. It
 * keeps rippling slowly; scrolling makes it ripple faster and pushes the wave
 * along in the direction of the scroll. Drawn as SVG strokes following the
 * tube (shading, edges, highlights and a soft shadow), updated per frame only
 * while the strip is on screen.
 */
export default function GlassBand() {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0, r: 0 });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const r = Math.round(Math.min(Math.max(w * 0.032, 20), 56));
      setSize((s) => (s.w === w ? s : { w, h: Math.round(r * 8.5), r }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = root.current;
    const { w, h, r } = size;
    if (!el || !w) return;
    const shadow = Array.from(el.querySelectorAll<SVGPathElement>("[data-shadow]"));
    const glass = Array.from(el.querySelectorAll<SVGPathElement>("[data-glass]"));

    const amp = r * 1.9;
    const k = (Math.PI * 2) / Math.max(w * 0.85, 560);
    const mid = h * 0.45;
    const fmt = (n: number) => Math.round(n * 10) / 10;
    let phase = 0;
    let lastY = window.scrollY;
    let speed = 0;
    let last: number | null = null;
    let raf = 0;
    let visible = false;
    const minStep = window.matchMedia("(pointer: coarse)").matches ? 1000 / 30 : 0;

    const centre = (px: number) =>
      mid + amp * Math.sin(px * k + phase) + amp * 0.28 * Math.sin(px * k * 2.2 - phase * 1.35);

    // Points of the centre line with their normals, then any offset line.
    const xs: number[] = [];
    const cy: number[] = [];
    const nx: number[] = [];
    const ny: number[] = [];
    const sample = () => {
      for (let i = 0; i <= POINTS; i++) {
        const px = -3 * r + (i / POINTS) * (w + 6 * r);
        const y = centre(px);
        const dy = centre(px + 1) - centre(px - 1);
        const len = Math.hypot(2, dy);
        xs[i] = px;
        cy[i] = y;
        nx[i] = -dy / len;
        ny[i] = 2 / len;
      }
    };
    const line = (offset: number, dx = 0, dy = 0) => {
      let d = "";
      for (let i = 0; i <= POINTS; i++) {
        d += `${i ? "L" : "M"}${fmt(xs[i] + nx[i] * offset * r + dx)} ${fmt(cy[i] + ny[i] * offset * r + dy)}`;
      }
      return d;
    };
    const draw = () => {
      sample();
      const s = line(0, r * 0.5, r * 1.15);
      for (const p of shadow) p.setAttribute("d", s);
      for (const p of glass) p.setAttribute("d", line(Number(p.dataset.glass)));
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      if (minStep && last !== null && now - last < minStep - 2) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      speed += (Math.abs(dy) - speed) * 0.15;
      // Slow ripple of its own; the scroll pushes the wave along.
      phase += dt * (0.9 + Math.min(speed * 0.04, 3)) + dy * 0.004;
      draw();
      raf = requestAnimationFrame(frame);
    };

    draw();
    const reduced = prefersReducedMotion();
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !reduced;
      last = null;
      lastY = window.scrollY;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [size]);

  const { w, h, r } = size;
  const stroke = (l: Layer) => ({
    fill: "none",
    // Highlights come and go along the tube, like reflections on real glass.
    stroke: l.glint ? "url(#glass-glint)" : l.color,
    strokeOpacity: l.alpha,
    strokeWidth: Math.max(1, l.width * r),
    strokeLinejoin: "round" as const,
  });

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none relative w-full overflow-hidden" style={{ height: h || 200 }}>
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
          <defs>
            <linearGradient id="glass-glint" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
              {[0.35, 1, 0.45, 0.25, 0.9, 1, 0.4, 0.3, 0.85, 0.5].map((o, i, all) => (
                <stop key={i} offset={i / (all.length - 1)} stopColor="#ffffff" stopOpacity={o} />
              ))}
            </linearGradient>
          </defs>
          {SHADOW.map((l, i) => (
            <path key={`s${i}`} data-shadow="" {...stroke(l)} />
          ))}
          {GLASS.map((l, i) => (
            <path key={`g${i}`} data-glass={l.at} {...stroke(l)} />
          ))}
        </svg>
      )}
    </div>
  );
}
