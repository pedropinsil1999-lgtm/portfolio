"use client";

import { useEffect, useId, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const POINTS = 56; // samples along the tube

/**
 * The identity's glass strip: a giant line of type running sideways, with a
 * glass tube waving across it. The type drifts slowly and speeds up (and
 * follows the direction) with the scroll; the tube keeps rippling, faster
 * while the page moves. Inside the tube the type is redrawn lighter, a touch
 * bigger and shifted, so it reads as refraction, with highlights along the
 * tube for the glass. Plain SVG updated a few attributes per frame, and only
 * while the strip is on screen.
 */
export default function GlassBand({ text }: { text: string }) {
  const root = useRef<HTMLDivElement>(null);
  const measure = useRef<SVGTextElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0, font: 0 });
  const [unit, setUnit] = useState(0);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const word = `${text.toUpperCase()}  `;

  // Size follows the width of the page.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const font = Math.round(Math.min(Math.max(w * 0.16, 76), 250));
      setSize((s) => (s.w === w ? s : { w, h: Math.round(font * 1.22), font }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Width of one repeat of the text, once the display font is in.
  useEffect(() => {
    if (!size.font) return;
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive && measure.current) setUnit(measure.current.getComputedTextLength());
    });
    return () => {
      alive = false;
    };
  }, [size.font, word]);

  useEffect(() => {
    const el = root.current;
    const { w, h, font } = size;
    if (!el || !w || !unit) return;
    const q = <T extends Element>(sel: string) => Array.from(el.querySelectorAll<T>(sel));
    const texts = q<SVGTextElement>("[data-run]");
    const clip = q<SVGPathElement>("[data-tube]");
    const lines = q<SVGPathElement>("[data-line]");

    const amp = font * 0.22;
    const r = font * 0.17;
    const k = (Math.PI * 2) / Math.max(w * 0.9, 600);
    const mid = h * 0.52;
    const fmt = (n: number) => Math.round(n * 10) / 10;

    let x = 0;
    let phase = 0;
    let lastY = window.scrollY;
    let speed = 0;
    let last: number | null = null;
    let raf = 0;
    let visible = false;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const minStep = touch ? 1000 / 30 : 0;

    const centre = (px: number) => mid + amp * Math.sin(px * k + phase) + amp * 0.3 * Math.sin(px * k * 2.3 - phase * 1.4);
    const draw = () => {
      // Tube outline (for the clip and the shadow) and lines along it.
      const top: string[] = [];
      const bottom: string[] = [];
      const along = (offset: number) => {
        let d = "";
        for (let i = 0; i <= POINTS; i++) {
          const px = -r + (i / POINTS) * (w + 2 * r);
          d += `${i ? "L" : "M"}${fmt(px)} ${fmt(centre(px) + offset * r)}`;
        }
        return d;
      };
      for (let i = 0; i <= POINTS; i++) {
        const px = -r + (i / POINTS) * (w + 2 * r);
        const c = centre(px);
        top.push(`${fmt(px)} ${fmt(c - r)}`);
        bottom.unshift(`${fmt(px)} ${fmt(c + r)}`);
      }
      const tube = `M${top.join("L")}L${bottom.join("L")}Z`;
      for (const p of clip) p.setAttribute("d", tube);
      for (const p of lines) p.setAttribute("d", along(Number(p.dataset.line)));
      const tx = `translate(${fmt(x)} 0)`;
      for (const t of texts) {
        const lens = t.dataset.run === "lens";
        // Through the glass: shifted up and a little magnified.
        t.setAttribute("transform", lens ? `${tx} translate(0 ${fmt(-r * 0.18)}) scale(1.02 1.03)` : tx);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
      if (minStep && last !== null && now - last < minStep - 2) {
        raf = requestAnimationFrame(frame);
        return;
      }
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      speed += (Math.abs(dy) - speed) * 0.15;
      phase += dt * (1.2 + Math.min(speed * 0.05, 4));
      x -= dt * 36 + dy * 0.7;
      x %= unit;
      if (x > 0) x -= unit;
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
  }, [size, unit]);

  const { w, h, font } = size;
  const repeats = unit ? Math.ceil(w / unit) + 2 : 1;
  const run = word.repeat(repeats);
  const baseline = h * 0.8;
  const textProps = {
    y: baseline,
    fontSize: font,
    className: "font-display",
    style: { whiteSpace: "pre" as const },
  };

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none relative w-full overflow-hidden" style={{ height: h || 160 }}>
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
          <defs>
            <clipPath id={`${id}-tube`}>
              <path data-tube="" />
            </clipPath>
          </defs>
          <text ref={measure} {...textProps} visibility="hidden">
            {word}
          </text>
          {/* Soft shadow of the tube on the page. */}
          <g transform={`translate(${font * 0.08} ${font * 0.22})`} opacity="0.07">
            <path data-tube="" fill="var(--preto)" />
          </g>
          <text data-run="base" {...textProps} fill="var(--preto)">
            {run}
          </text>
          <g clipPath={`url(#${id}-tube)`}>
            <text data-run="lens" {...textProps} fill="#2c2390">
              {run}
            </text>
            <rect width={w} height={h} fill="var(--branco)" opacity="0.26" />
          </g>
          {/* Glass: a soft sheen, a crisp highlight on top, a darker rim and a
              caustic glint underneath. */}
          <path data-line="-0.25" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth={font * 0.1} strokeLinecap="round" />
          <path data-line="-0.62" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth={Math.max(2, font * 0.022)} strokeLinecap="round" />
          <path data-line="0.92" fill="none" stroke="var(--preto)" strokeOpacity="0.28" strokeWidth={Math.max(1.5, font * 0.016)} />
          <path data-line="-0.96" fill="none" stroke="var(--preto)" strokeOpacity="0.18" strokeWidth={Math.max(1, font * 0.01)} />
          <path data-line="0.62" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth={Math.max(1.5, font * 0.014)} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
