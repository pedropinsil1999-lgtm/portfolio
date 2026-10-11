"use client";

import { useEffect, useRef, useState } from "react";
import { Warp } from "@paper-design/shaders-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Closing section background: a liquid gradient (Paper's "warp" shader, as in
 * Framer's Animated Liquid Background, "Mist" settings) in the light blues of
 * the palette, so the dark navy title stays readable on top.
 * It fades in on the same scroll range as the page colour (see ScrollTheme),
 * so the navy dissolves into the liquid instead of meeting it at an edge.
 * Compiling the shader is a hitch, so it is done once the page is idle (or
 * as soon as the section gets near) and then kept: it pauses by itself while
 * off screen, and a static look-alike stands in until it exists. Frozen for
 * reduced motion.
 */
export default function Liquid() {
  const ref = useRef<HTMLDivElement>(null);
  const [speed] = useState(() => (typeof window !== "undefined" && prefersReducedMotion() ? 0 : 1.1));
  const [near, setNear] = useState(false);
  // Fewer shader pixels on touch screens (weaker GPUs); read on the client only.
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mount = () => {
      setTouch(window.matchMedia("(pointer: coarse)").matches);
      setNear(true);
    };
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && mount(), { rootMargin: "100% 0px" });
    io.observe(el);
    // Otherwise warm it up in a quiet moment, well after the page has settled.
    let idle = 0;
    const timer = window.setTimeout(() => {
      idle = window.requestIdleCallback?.(mount, { timeout: 3000 }) ?? window.setTimeout(mount, 0);
    }, 3000);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      // Paper's shader leaves its GPU context to the garbage collector; free it
      // now, or every visit adds one (browsers cap them and drop the oldest,
      // which may be one still on screen). Runs before the shader's own clean-up.
      const canvas = el.querySelector("canvas");
      canvas?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  useGSAP(
    () => {
      const section = ref.current?.closest("section");
      if (!section) return;
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          // Lags the colour blend a little so the liquid lands on a light page.
          ease: "power2.in",
          // Clamped: a short closing section may not reach 15% before the page ends.
          scrollTrigger: { trigger: section, start: "top 75%", end: "clamp(top 15%)", scrub: true },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 45% at 30% 35%, #c2e8ff 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 72% 60%, rgb(114 152 175 / 0.45) 0%, transparent 70%), #eaffff",
      }}
    >
      {near && (
        <Warp
          className="h-full w-full"
          colors={["#eaffff", "#c2e8ff", "#7298af", "#eaffff", "#c2e8ff"]}
          proportion={0.35}
          softness={1}
          distortion={0.18}
          swirl={0.8}
          swirlIterations={5}
          shape="edge"
          shapeScale={0.5}
          scale={0.6}
          rotation={0}
          speed={speed}
          // The liquid is soft, so a low-resolution buffer stretched to fit looks the
          // same and costs a fraction of the GPU work of a full-resolution one.
          minPixelRatio={1}
          maxPixelCount={touch ? 360 * 240 : 640 * 400}
        />
      )}
      {/* Ice-white veil behind the copy: the liquid stays alive at the edges
          while the title and button sit on a calm, light ground. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 46% at 50% 52%, rgb(234 255 255 / 0.92) 0%, rgb(234 255 255 / 0.7) 45%, rgb(234 255 255 / 0) 100%)",
        }}
      />
      {/* Soft top and bottom so the section has no edges: a fade to the page
          colour on top (a mask over the moving liquid would cost an extra GPU
          pass every frame). */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, var(--page-bg), transparent 22%, transparent 72%, var(--page-bg))" }}
      />
    </div>
  );
}
