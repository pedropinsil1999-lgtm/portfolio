"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { GRAIN } from "@/lib/grain";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";

// Resting spot of the light (fraction of the frame), top-left corner.
const REST = { x: 0.18, y: 0.2 };
// How far towards the cursor the light leans (1 = all the way).
const LEAN = 0.55;

/**
 * About page background: a very soft light-blue glow resting in a corner. It
 * breathes slowly and drifts, unhurried, towards the cursor, like ambient
 * light in a room. No shapes, only atmosphere.
 */
export default function AmbientLight() {
  const root = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = root.current;
    const el = glow.current;
    if (!box || !el) return;

    const reduced = prefersReducedMotion();
    let W = box.clientWidth;
    let H = box.clientHeight;
    // Centre the disc on the anchor; GSAP owns its transform (scale too).
    gsap.set(el.firstElementChild, { xPercent: -50, yPercent: -50 });
    const place = (x: number, y: number) => gsap.set(el, { x, y });
    place(W * REST.x, H * REST.y);

    const ro = new ResizeObserver(() => {
      W = box.clientWidth;
      H = box.clientHeight;
      if (reduced) place(W * REST.x, H * REST.y);
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

    // Breathing: a slow swell in size and strength.
    const breath = gsap.to(el.firstElementChild, {
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
      xTo(W * REST.x + (x - W * REST.x) * LEAN);
      yTo(H * REST.y + (y - H * REST.y) * LEAN);
    };
    const rest = () => lean(W * REST.x, H * REST.y);

    // Keep the last viewport position so scrolling with a still mouse keeps
    // the light leaning towards it.
    let last: { clientX: number; clientY: number } | null = null;
    const follow = () => {
      if (!last) return rest();
      const r = box.getBoundingClientRect();
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

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let wander: gsap.core.Tween | undefined;
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", follow, { passive: true });
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

    return () => {
      ro.disconnect();
      undoIntro();
      breath.kill();
      wander?.kill();
      gsap.killTweensOf(el);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", follow);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={root} className="absolute inset-0">
      {/* Anchored at its centre; GSAP moves it with x/y. */}
      <div ref={glow} className="absolute left-0 top-0 h-0 w-0">
        <div
          className="absolute h-[110vmax] w-[110vmax] rounded-full will-change-transform"
          // Many eased stops so the falloff has no visible rings.
          style={{
            background:
              "radial-gradient(circle, rgb(194 232 255 / 0.17) 0%, rgb(194 232 255 / 0.14) 10%, rgb(194 232 255 / 0.1) 20%, rgb(194 232 255 / 0.066) 30%, rgb(194 232 255 / 0.038) 40%, rgb(194 232 255 / 0.018) 50%, rgb(194 232 255 / 0.006) 60%, transparent 70%)",
          }}
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
