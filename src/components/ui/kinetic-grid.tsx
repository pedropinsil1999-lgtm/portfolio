"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";

/**
 * Kinetic grid background: a line grid that bends away from the pointer and
 * ripples on click. Adapted to the portfolio palette and scoped to its own
 * container (canvas sized to the section, not the window; paused off-screen).
 */

type Point = { x: number; y: number };
type Ripple = { x: number; y: number; radius: number; opacity: number; born: number };
type RGBA = { r: number; g: number; b: number; a: number };

const CELL_SIZE = 64;
const INFLUENCE_RADIUS = 260;
const MAX_WARP = 24;
const DOT_SPACING = 32;
const LERP_SPEED = 0.08;
const NODE_BASE_RADIUS = 1.4;
const NODE_ACTIVE_RADIUS = 3;
const OFFSCREEN = -9999;
const EDGE_PAD = 2;

// Palette: white strokes on black; red only where the pointer touches
// (active nodes, their glow, the click ripple).
// (Test palette: light blue #C2E8FF strokes, steel blue #7298AF signal.)
const WHITE = "194,232,255";
const RED = "114,152,175";
const LINE_BASE: RGBA = { r: 194, g: 232, b: 255, a: 0.045 };
const LINE_ACTIVE: RGBA = { r: 194, g: 232, b: 255, a: 0.35 };
const NODE_BASE: RGBA = { r: 194, g: 232, b: 255, a: 0.07 };
const NODE_ACTIVE: RGBA = { r: 114, g: 152, b: 175, a: 0.95 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function lerpColor(base: RGBA, active: RGBA, t: number) {
  return `rgba(${Math.round(lerp(base.r, active.r, t))},${Math.round(
    lerp(base.g, active.g, t),
  )},${Math.round(lerp(base.b, active.b, t))},${lerp(base.a, active.a, t).toFixed(3)})`;
}

function warpPoint(
  gx: number,
  gy: number,
  col: number,
  row: number,
  cols: number,
  rows: number,
  mouse: Point,
  ripples: Ripple[],
): { pt: Point; proximity: number } {
  // Pin the outer rows/cols so the frame edges stay straight.
  const edge = 1.5;
  const colPin = Math.min(col / edge, (cols - 1 - col) / edge, 1);
  const rowPin = Math.min(row / edge, (rows - 1 - row) / edge, 1);
  const pin = colPin * colPin * rowPin * rowPin;

  const dx = gx - mouse.x;
  const dy = gy - mouse.y;
  const dist = Math.hypot(dx, dy);
  const proximity = Math.max(0, 1 - dist / INFLUENCE_RADIUS) * pin;

  let rx = 0;
  let ry = 0;
  for (const r of ripples) {
    const rdx = gx - r.x;
    const rdy = gy - r.y;
    const diff = Math.hypot(rdx, rdy) - r.radius;
    const waveWidth = 55;
    if (Math.abs(diff) < waveWidth) {
      const strength = (1 - Math.abs(diff) / waveWidth) * r.opacity * 18 * pin;
      const angle = Math.atan2(rdy, rdx);
      const sign = diff < 0 ? 1 : -1;
      rx += Math.cos(angle) * strength * sign;
      ry += Math.sin(angle) * strength * sign;
    }
  }

  if (dist < INFLUENCE_RADIUS && dist > 0 && pin > 0) {
    const t = dist / INFLUENCE_RADIUS;
    const eased = (1 - t) * (1 - t) * Math.min(1, dist / 60);
    const warp = eased * MAX_WARP * pin;
    const angle = Math.atan2(dy, dx);
    return {
      pt: { x: gx - Math.cos(angle) * warp + rx, y: gy - Math.sin(angle) * warp + ry },
      proximity,
    };
  }
  return { pt: { x: gx + rx, y: gy + ry }, proximity };
}

export default function KineticGrid({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    const mouse: Point = { x: OFFSCREEN, y: OFFSCREEN };
    const target: Point = { x: OFFSCREEN, y: OFFSCREEN };
    const ripples: Ripple[] = [];
    const dots = document.createElement("canvas");
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;

    const draw = (now: number) => {
      // Zero-sized while the route is kept mounted but hidden; nothing to draw.
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(dots, 0, 0, W, H);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = (now - r.born) / 1000;
        r.radius = Math.max(0, age * 400);
        r.opacity = Math.max(0, 1 - age * 1.2);
        if (r.opacity <= 0) ripples.splice(i, 1);
      }

      // The grid extends EDGE_PAD cells past every side, so the pinned
      // border rows/cols sit off-canvas and the visible edges warp freely.
      const visCols = Math.max(2, Math.ceil(W / CELL_SIZE));
      const visRows = Math.max(2, Math.ceil(H / CELL_SIZE));
      const cellW = W / visCols;
      const cellH = H / visRows;
      const cols = visCols + 1 + EDGE_PAD * 2;
      const rows = visRows + 1 + EDGE_PAD * 2;
      const pts: Point[][] = [];
      const prox: number[][] = [];
      for (let row = 0; row < rows; row++) {
        pts[row] = [];
        prox[row] = [];
        for (let col = 0; col < cols; col++) {
          const { pt, proximity } = warpPoint(
            (col - EDGE_PAD) * cellW,
            (row - EDGE_PAD) * cellH,
            col,
            row,
            cols,
            rows,
            mouse,
            ripples,
          );
          pts[row][col] = pt;
          prox[row][col] = proximity;
        }
      }

      // Untouched lines and nodes (almost all of them) go into one path each;
      // only the few near the pointer or a ripple are stroked on their own.
      const restLines = new Path2D();
      const live: [Point, Point, number][] = [];
      const seg = (p1: Point, p2: Point, pr1: number, pr2: number) => {
        const t = smoothstep((pr1 + pr2) / 2);
        if (t < 0.005) {
          restLines.moveTo(p1.x, p1.y);
          restLines.lineTo(p2.x, p2.y);
        } else live.push([p1, p2, t]);
      };
      const stroke = ([p1, p2, t]: [Point, Point, number]) => {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = lerpColor(LINE_BASE, LINE_ACTIVE, t);
        ctx.lineWidth = lerp(0.8, 1.4, t);
        ctx.stroke();
      };
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols - 1; col++)
          seg(pts[row][col], pts[row][col + 1], prox[row][col], prox[row][col + 1]);
      for (let col = 0; col < cols; col++)
        for (let row = 0; row < rows - 1; row++)
          seg(pts[row][col], pts[row + 1][col], prox[row][col], prox[row + 1][col]);
      ctx.strokeStyle = lerpColor(LINE_BASE, LINE_ACTIVE, 0);
      ctx.lineWidth = 0.8;
      ctx.stroke(restLines);
      live.forEach(stroke);

      const restNodes = new Path2D();

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const p = pts[row][col];
          const t = smoothstep(prox[row][col]);
          if (t < 0.005) {
            restNodes.moveTo(p.x + NODE_BASE_RADIUS, p.y);
            restNodes.arc(p.x, p.y, NODE_BASE_RADIUS, 0, Math.PI * 2);
            continue;
          }
          const radius = lerp(NODE_BASE_RADIUS, NODE_ACTIVE_RADIUS, t);
          if (t > 0.3) {
            const glowR = radius + lerp(0, 6, (t - 0.3) / 0.7);
            const grd = ctx.createRadialGradient(p.x, p.y, radius * 0.5, p.x, p.y, glowR);
            grd.addColorStop(0, `rgba(${RED},${(t * 0.25).toFixed(3)})`);
            grd.addColorStop(1, `rgba(${RED},0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = lerpColor(NODE_BASE, NODE_ACTIVE, t);
          ctx.fill();
        }
      }

      ctx.fillStyle = lerpColor(NODE_BASE, NODE_ACTIVE, 0);
      ctx.fill(restNodes);

      for (const r of ripples) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${RED},${(r.opacity * 0.35).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      mouse.x = lerp(mouse.x, target.x, LERP_SPEED);
      mouse.y = lerp(mouse.y, target.y, LERP_SPEED);
      draw(now);
      // Nothing moving (pointer settled or away, no ripples): keep the last
      // frame and sleep until the next pointer move or click.
      const moving = Math.abs(mouse.x - target.x) > 0.3 || Math.abs(mouse.y - target.y) > 0.3;
      raf = moving || ripples.length ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Size to the container; the static dot texture is pre-rendered once per resize.
    const resize = () => {
      const rect = container.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      dots.width = canvas.width;
      dots.height = canvas.height;
      const dctx = dots.getContext("2d");
      if (dctx) {
        dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dctx.fillStyle = `rgba(${WHITE},0.03)`;
        for (let x = DOT_SPACING / 2; x < W; x += DOT_SPACING)
          for (let y = DOT_SPACING / 2; y < H; y += DOT_SPACING) {
            dctx.beginPath();
            dctx.arc(x, y, 0.7, 0, Math.PI * 2);
            dctx.fill();
          }
      }
      draw(performance.now());
    };

    // Pointer is tracked on the window and mapped into the grid's box, so
    // overlays on top of the hero (the fixed header, the custom cursor) don't
    // swallow the movement.
    const local = (e: { clientX: number; clientY: number }): Point | null => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? { x, y } : null;
    };
    // Last pointer position in the viewport, so scrolling with a still mouse
    // keeps the bend under the cursor.
    let last: { clientX: number; clientY: number } | null = null;
    const onLeave = () => {
      last = null;
      target.x = OFFSCREEN;
      target.y = OFFSCREEN;
      start();
    };
    const onMove = (e: { clientX: number; clientY: number }) => {
      last = { clientX: e.clientX, clientY: e.clientY };
      const p = local(e);
      if (!p) {
        target.x = OFFSCREEN;
        target.y = OFFSCREEN;
        return start();
      }
      target.x = p.x;
      target.y = p.y;
      start();
    };
    const ripple = (x: number, y: number) => {
      ripples.push({ x, y, radius: 0, opacity: 1, born: performance.now() });
      start();
    };
    const onDown = (e: PointerEvent) => {
      // Clicks on links/buttons (e.g. the nav) navigate; no ripple.
      if ((e.target as Element | null)?.closest?.("a, button")) return;
      const p = local(e);
      if (p) ripple(p.x, p.y);
    };
    const onScroll = () => last && onMove(last);
    const onVisibility = () => (document.hidden ? stop() : start());

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersection.observe(container);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    start();
    // When the intro curtain opens, send one wave out from the centre.
    const offIntro = whenIntroDone(() => ripple(W / 2, H / 2));

    return () => {
      offIntro();
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full overflow-x-clip", className)}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        // Dissolve the grid at both ends: under the header (so it does not compete
        // with the nav) and into the next section (no hard edge).
        style={{
          maskImage: "linear-gradient(to bottom, rgb(0 0 0 / 0.35) 0%, #000 24%, #000 45%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgb(0 0 0 / 0.35) 0%, #000 24%, #000 45%, transparent 92%)",
        }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
