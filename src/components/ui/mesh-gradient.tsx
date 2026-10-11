"use client";

// Mesh gradient background, adapted from the 21st.dev Shader Builder
// ("Mesh Gradient"), itself adapted from Paper Shaders
// (https://shaders.paper.design/mesh-gradient, Apache-2.0).
//
// Trimmed for the portfolio, where several of these sit in a stack of cards:
// - The field is soft, so it renders into a tiny buffer (PIXEL_BUDGET) that
//   CSS stretches to fit: a fraction of the GPU work of full resolution.
// - It draws at most FPS frames a second; the motion is slow anyway.
// - It only animates while `active`, on screen and with the tab visible, and
//   only holds a GPU context while near the viewport (and `enabled`); the rest
//   of the time a static CSS look-alike stands in. A page full of these keeps
//   one or two live contexts instead of one per instance.
// - Grain, blur, OKLab and colour grading were removed from the shader; grain
//   comes from a static CSS layer instead (the caller adds it).

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const PIXEL_BUDGET = 90_000; // ~ 380×240: plenty for a blurry field
const FPS = 30;
// Phones and tablets have far weaker GPUs: fewer pixels and frames there.
const TOUCH_PIXEL_BUDGET = 50_000;
const TOUCH_FPS = 24;

const VERT = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAG = `precision mediump float;
uniform vec3 u_colors[6];
uniform vec4 u_scene;   // resolution.xy, time, colour count
uniform vec4 u_shape;   // scale, intensity, softness, warp
uniform vec4 u_misc;    // seed, vignette, cursor presence, cursor strength
uniform vec4 u_mouse;   // cursor.xy (-1..1), cursor radius, -

float hash21(vec2 p) {
  p = mod(p, 31.0);
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 res = u_scene.xy;
  float t = u_scene.z;
  vec2 uv = gl_FragCoord.xy / res;
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);

  // Cursor swirl: the field twists gently around the pointer.
  if (u_misc.z > 0.001) {
    vec2 c = (0.5 * u_mouse.xy * res) / min(res.x, res.y);
    vec2 d = p - c;
    float m = u_misc.z * (1.0 - smoothstep(0.0, u_mouse.z, length(d)));
    float ang = m * u_misc.w * 2.2;
    float ca = cos(ang), sa = sin(ang);
    p = c + mat2(ca, -sa, sa, ca) * d;
  }

  p *= u_shape.x;
  if (u_shape.w > 0.0) {
    p += u_shape.w * (vec2(fbm(p * 1.8 + u_misc.x), fbm(p * 1.8 + vec2(5.2, 1.3))) - 0.5);
  }

  // Coloured blobs orbiting slowly, blended by distance.
  vec3 col = u_colors[0] * 0.16;
  float w = 0.16;
  float falloff = mix(12.0, 2.4, u_shape.z);
  for (int i = 0; i < 6; i++) {
    if (float(i) >= u_scene.w) break;
    float fi = float(i);
    vec2 center = vec2(sin(fi * 2.17 + t * 0.13 + u_misc.x), cos(fi * 1.63 - t * 0.11)) * (0.22 + u_shape.y * 0.62);
    float k = exp(-dot(p - center, p - center) * falloff);
    col += u_colors[i] * k;
    w += k;
  }
  col /= w;

  if (u_misc.y > 0.0) {
    float vd = length(uv - 0.5) * 1.41421356;
    col *= 1.0 - u_misc.y * smoothstep(0.35, 1.0, vd);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export type MeshGradientProps = {
  /** 2 to 6 hex colours; the first is also the base tone. */
  colors: string[];
  scale?: number;
  /** How far the colour blobs travel from the centre (0..1). */
  intensity?: number;
  /** Blob softness (0 = tight, 1 = very soft). */
  softness?: number;
  /** Organic distortion of the field (0 = none). */
  warp?: number;
  vignette?: number;
  seed?: number;
  /** Motion speed; 0 freezes it. */
  speed?: number;
  /** Twist the field around the pointer (mouse only). */
  cursor?: boolean;
  /** Animate. When false the last frame stays on screen (cheap pause). */
  active?: boolean;
  /**
   * Keep a GPU context at all. When false the canvas is dropped and the static
   * CSS fallback shows instead (e.g. a card fully covered by the next one).
   */
  enabled?: boolean;
  className?: string;
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// Contexts are released a moment after unmount, so an immediate remount on
// the same element (React's dev double-mount) takes the live context back.
const pendingRelease = new WeakMap<HTMLCanvasElement, number>();

/** Static look-alike of the field, shown before the canvas and when it is dropped. */
const fallback = (colors: string[], vignette: number) => {
  const [base, a = base, b = a, c = b] = colors;
  const vig = vignette > 0 ? `radial-gradient(ellipse at center, transparent 45%, rgb(0 0 0 / ${0.5 * vignette}) 100%), ` : "";
  return `${vig}radial-gradient(ellipse 70% 60% at 32% 38%, ${b} 0%, transparent 70%), radial-gradient(ellipse 60% 55% at 72% 68%, ${c} 0%, transparent 70%), ${a}`;
};

export function MeshGradient({ enabled = true, className, ...field }: MeshGradientProps) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // A fresh <canvas> per GPU context: a context that was released (or lost)
  // can never be revived on the same element, so the element is swapped.
  const [generation, setGeneration] = useState(0);

  // Only hold a context while the field is on screen or about to be.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "50% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={box}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, background: fallback(field.colors, field.vignette ?? 0) }}
    >
      {near && enabled && <MeshCanvas key={generation} {...field} onLost={() => setGeneration((g) => g + 1)} />}
    </div>
  );
}

type MeshCanvasProps = Omit<MeshGradientProps, "enabled" | "className"> & { onLost: () => void };

/** The live field: one canvas, one GPU context, released on unmount. */
function MeshCanvas({
  colors,
  scale = 1.26,
  intensity = 0.35,
  softness = 0.28,
  warp = 0,
  vignette = 0,
  seed = 1,
  speed = 0.575,
  cursor = false,
  active = true,
  onLost,
}: MeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const wake = useRef<() => void>(() => {});

  useEffect(() => {
    activeRef.current = active;
    wake.current();
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    window.clearTimeout(pendingRelease.get(canvas));
    pendingRelease.delete(canvas);
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    if (gl.isContextLost()) {
      // This element's context was released (a hidden route shown again):
      // ask for a fresh canvas.
      onLost();
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uScene = u("u_scene");
    const uMisc = u("u_misc");
    const uMouse = u("u_mouse");
    const list = colors.slice(0, 6);
    const flat = new Float32Array(18);
    list.forEach((c, i) => flat.set(hexToRgb(c), i * 3));
    gl.uniform3fv(u("u_colors"), flat);
    gl.uniform4f(u("u_shape"), scale, intensity, softness, warp);

    const reduced = prefersReducedMotion();
    const rate = reduced ? 0 : speed;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const budget = touch ? TOUCH_PIXEL_BUDGET : PIXEL_BUDGET;
    const fps = touch ? TOUCH_FPS : FPS;
    // Bounds are cached and only re-read once per frame after a scroll, never
    // on every pointer event (reading layout per event is what makes pages stutter).
    let bounds = canvas.getBoundingClientRect();
    let boundsStale = false;
    let raf = 0;
    let lastDraw = 0;
    let elapsed = seed * 7; // different start per instance, no visible jump
    let lastNow: number | null = null;
    let inView = true;
    let visible = !document.hidden;
    const target = { x: 0, y: 0, on: 0 };
    const mouse = { x: 0, y: 0, on: 0 };
    let last: { x: number; y: number } | null = null;

    const resize = () => {
      bounds = canvas.getBoundingClientRect();
      const area = Math.max(1, bounds.width * bounds.height);
      const k = Math.min(1, Math.sqrt(budget / area));
      const w = Math.max(1, Math.round(bounds.width * k));
      const h = Math.max(1, Math.round(bounds.height * k));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = () => {
      gl.uniform4f(uScene, canvas.width, canvas.height, elapsed * rate, list.length);
      gl.uniform4f(uMisc, seed, vignette, cursor ? mouse.on : 0, 0.65);
      gl.uniform4f(uMouse, mouse.x, mouse.y, 0.46, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const running = () => activeRef.current && inView && visible;
    const settling = () =>
      Math.abs(target.x - mouse.x) > 0.002 || Math.abs(target.y - mouse.y) > 0.002 || Math.abs(target.on - mouse.on) > 0.002;

    const frame = (now: number) => {
      raf = 0;
      if (!running()) {
        lastNow = null;
        return;
      }
      const dt = lastNow === null ? 0 : Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;
      elapsed += dt;
      const follow = 1 - Math.exp(-8 * dt);
      mouse.x += (target.x - mouse.x) * follow;
      mouse.y += (target.y - mouse.y) * follow;
      mouse.on += (target.on - mouse.on) * follow;
      if (now - lastDraw >= 1000 / fps - 2) {
        lastDraw = now;
        draw();
      }
      if (rate > 0 || settling()) raf = requestAnimationFrame(frame);
      else lastNow = null;
    };
    const kick = () => {
      if (!raf && running()) raf = requestAnimationFrame(frame);
    };
    wake.current = kick;

    const aim = () => {
      if (!last || !inView) return;
      if (boundsStale) {
        bounds = canvas.getBoundingClientRect();
        boundsStale = false;
      }
      const inside = last.x >= bounds.left && last.x <= bounds.right && last.y >= bounds.top && last.y <= bounds.bottom;
      if (inside) {
        const nx = ((last.x - bounds.left) / bounds.width) * 2 - 1;
        const ny = -(((last.y - bounds.top) / bounds.height) * 2 - 1);
        if (target.on === 0 && mouse.on < 0.01) {
          mouse.x = nx;
          mouse.y = ny;
        }
        target.x = nx;
        target.y = ny;
      }
      target.on = inside ? 1 : 0;
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = { x: e.clientX, y: e.clientY };
      aim();
    };
    let scrollFrame = 0;
    const onScroll = () => {
      boundsStale = true;
      if (!scrollFrame && inView) {
        scrollFrame = requestAnimationFrame(() => {
          scrollFrame = 0;
          aim();
        });
      }
    };
    const onLeave = () => {
      last = null;
      target.on = 0;
      kick();
    };
    if (cursor && !reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      boundsStale = true;
      kick();
    });
    io.observe(canvas);
    const onVisibility = () => {
      visible = !document.hidden;
      kick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    draw();
    canvas.style.opacity = "1";
    kick();

    return () => {
      wake.current = () => {};
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollFrame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      // Free the GPU context (deferred, see pendingRelease). If the element
      // comes back later (a hidden route shown again), the lost context is
      // noticed and a fresh canvas is made.
      const timer = window.setTimeout(() => {
        pendingRelease.delete(canvas);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }, 0);
      pendingRelease.set(canvas, timer);
    };
    // Colours and shape are fixed per mount; remount to change them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", opacity: 0, transition: "opacity 0.6s ease" }}
    />
  );
}
