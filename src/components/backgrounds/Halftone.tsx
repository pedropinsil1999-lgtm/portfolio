"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";

const STEP = 18; // grid spacing (px)
const DOT = 0.9; // resting dot radius (px)
const REACH = 170; // cursor influence radius (px)
const GROW = 2.6; // extra radius under the cursor (px)
const PUSH = 10; // how far dots move away from the cursor (px)
const RING_SPEED = 620; // click ripple speed (px/s)
const RING_WIDTH = 70; // ripple thickness (px)
const RING_LIFE = 1.5; // ripple lifetime (s)
const INK = "194,232,255"; // light blue hairline colour of the palette
const BASE_ALPHA = 0.1;

type Ripple = { x: number; y: number; t0: number };

/**
 * Work page background: a halftone screen, the dot pattern of printed matter.
 * Near the cursor the dots swell and part like wet ink; a click sends a ring
 * through the screen. At rest it is a faint texture and costs nothing.
 */
export default function Halftone() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    let W = 0;
    let H = 0;
    let dpr = 1;
    let rect = canvas.getBoundingClientRect();
    let raf = 0;
    let visible = true;

    // Smoothed pointer and how strongly it acts (fades in/out on enter/leave).
    const target = { x: -9999, y: -9999, on: 0 };
    const p = { x: -9999, y: -9999, on: 0 };
    const ripples: Ripple[] = [];
    // The resting screen, painted once per size. While only the cursor acts,
    // a frame is this bitmap plus a redraw of the few dots around the cursor.
    const restLayer = document.createElement("canvas");
    const paintRest = () => {
      restLayer.width = canvas.width;
      restLayer.height = canvas.height;
      const rc = restLayer.getContext("2d");
      if (!rc) return;
      rc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const path = new Path2D();
      const rows = Math.ceil(H / STEP) + 1;
      const cols = Math.ceil(W / STEP) + 1;
      for (let r = 0; r < rows; r++) {
        const shift = r % 2 ? STEP / 2 : 0;
        for (let c = 0; c < cols; c++) {
          const x0 = c * STEP + shift;
          path.moveTo(x0 + DOT, r * STEP);
          path.arc(x0, r * STEP, DOT, 0, Math.PI * 2);
        }
      }
      rc.fillStyle = `rgba(${INK},${BASE_ALPHA})`;
      rc.fill(path);
    };

    const draw = (now: number) => {
      if (!W || !H) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = now / 1000;
      // Drop finished ripples.
      for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > RING_LIFE) ripples.splice(i, 1);

      // Which dots to visit: all of them while a ripple crosses the screen;
      // otherwise the bitmap is laid down and only a square around the cursor
      // is cleared and redrawn (clipped, so dots on its edge stay seamless).
      let r0 = 0;
      let r1 = Math.ceil(H / STEP) + 1;
      let c0 = 0;
      let c1 = Math.ceil(W / STEP) + 1;
      const local = !ripples.length;
      if (local) {
        ctx.drawImage(restLayer, 0, 0);
        if (p.on <= 0.001) return;
        const reach = REACH + PUSH + DOT + GROW + 2;
        const x = p.x - reach;
        const y = p.y - reach;
        ctx.clearRect(x * dpr, y * dpr, 2 * reach * dpr, 2 * reach * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, 2 * reach, 2 * reach);
        ctx.clip();
        r0 = Math.max(0, Math.floor(y / STEP) - 1);
        r1 = Math.min(r1, Math.ceil((y + 2 * reach) / STEP) + 1);
        c0 = Math.max(0, Math.floor(x / STEP) - 1);
        c1 = Math.min(c1, Math.ceil((x + 2 * reach) / STEP) + 1);
      } else {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Resting dots go into one path; disturbed dots are drawn on their own.
      const rest = new Path2D();
      for (let r = r0; r < r1; r++) {
        const y0 = r * STEP;
        const shift = r % 2 ? STEP / 2 : 0; // staggered rows, like a print screen
        for (let c = c0; c < c1; c++) {
          const x0 = c * STEP + shift;
          let force = 0;
          let dx = 0;
          let dy = 0;

          if (p.on > 0.001) {
            const ex = x0 - p.x;
            const ey = y0 - p.y;
            const d = Math.hypot(ex, ey);
            if (d < REACH) {
              const k = (1 - d / REACH) ** 2 * p.on;
              force += k;
              if (d > 0.01) {
                dx += (ex / d) * k * PUSH;
                dy += (ey / d) * k * PUSH;
              }
            }
          }

          for (const rp of ripples) {
            const age = t - rp.t0;
            const ex = x0 - rp.x;
            const ey = y0 - rp.y;
            const d = Math.hypot(ex, ey);
            const off = Math.abs(d - age * RING_SPEED);
            if (off < RING_WIDTH) {
              const k = (1 - off / RING_WIDTH) * (1 - age / RING_LIFE) * 0.9;
              force += k;
              if (d > 0.01) {
                dx += (ex / d) * k * PUSH * 0.6;
                dy += (ey / d) * k * PUSH * 0.6;
              }
            }
          }

          if (force < 0.01) {
            rest.moveTo(x0 + DOT, y0);
            rest.arc(x0, y0, DOT, 0, Math.PI * 2);
            continue;
          }
          const f = Math.min(force, 1);
          ctx.beginPath();
          ctx.arc(x0 + dx, y0 + dy, DOT + GROW * f, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${INK},${(BASE_ALPHA + 0.32 * f).toFixed(3)})`;
          ctx.fill();
        }
      }
      ctx.fillStyle = `rgba(${INK},${BASE_ALPHA})`;
      ctx.fill(rest);
      if (local) ctx.restore();
    };

    // Only animate while something is moving; at rest the frame is static.
    const loop = (now: number) => {
      p.x += (target.x - p.x) * 0.18;
      p.y += (target.y - p.y) * 0.18;
      p.on += (target.on - p.on) * 0.08;
      draw(now);
      const settling = Math.abs(target.on - p.on) > 0.002 || Math.hypot(target.x - p.x, target.y - p.y) > 0.3;
      // Pointer parked and no ripples: keep this frame until the next move.
      raf = settling || ripples.length ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const inside = (x: number, y: number) => x >= 0 && y >= 0 && x <= W && y <= H;
    // Last mouse position in the viewport, so scrolling with a still mouse
    // keeps the swell under the cursor.
    let last: { clientX: number; clientY: number } | null = null;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = { clientX: e.clientX, clientY: e.clientY };
      onMove(last);
    };
    // The canvas rect is cached; a scroll only marks it stale and it is read
    // again at most once per frame.
    let rectStale = false;
    let scrollFrame = 0;
    const onScroll = () => {
      rectStale = true;
      if (last && !scrollFrame) {
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          if (last) onMove(last);
        });
      }
    };
    const onMove = (e: { clientX: number; clientY: number }) => {
      if (!visible) return;
      if (rectStale) {
        rect = canvas.getBoundingClientRect();
        rectStale = false;
      }
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const was = target.on;
      target.on = inside(x, y) ? 1 : 0;
      if (target.on) {
        if (!was && p.on < 0.01) {
          p.x = x;
          p.y = y;
        }
        target.x = x;
        target.y = y;
      }
      kick();
    };
    const onLeave = () => {
      last = null;
      target.on = 0;
      kick();
    };
    const onDown = (e: PointerEvent) => {
      rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!inside(x, y)) return;
      ripples.push({ x, y, t0: performance.now() / 1000 });
      if (ripples.length > 4) ripples.shift();
      kick();
    };

    const resize = () => {
      rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      // Capped low: tiny soft dots look the same, and the full-screen bitmap is
      // redrawn on every pointer move, so pixels are the cost.
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      paintRest();
      draw(performance.now());
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      rectStale = true;
      if (visible) kick();
    });
    io.observe(canvas);
    const onVisibility = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    // Fade the screen in once the intro has cleared.
    let undoIntro: (() => void) | void;
    if (!reduced) {
      gsap.set(canvas, { autoAlpha: 0 });
      undoIntro = whenIntroDone(() => gsap.to(canvas, { autoAlpha: 1, duration: 1.4, delay: 0.2, ease: "power2.out" }));
    }

    resize();
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollFrame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (typeof undoIntro === "function") undoIntro();
      gsap.killTweensOf(canvas);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Dissolve into the frame edges so the section never ends in a hard cut
          (a colour fade on top: cheaper than masking the canvas). */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 85% 80% at 60% 40%, transparent 35%, var(--page-bg) 100%)" }}
      />
    </>
  );
}
