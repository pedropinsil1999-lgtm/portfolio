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
 * The shader only exists while the section is near the viewport (a static
 * look-alike stands in otherwise), so it holds no GPU context elsewhere on
 * the page. Frozen for reduced motion.
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
    const io = new IntersectionObserver(
      ([entry]) => {
        setTouch(window.matchMedia("(pointer: coarse)").matches);
        setNear(entry.isIntersecting);
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
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
      // Soft top and bottom so the section has no edges.
      style={{
        maskImage: "linear-gradient(to bottom, transparent, #000 22%, #000 72%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 22%, #000 72%, transparent)",
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
    </div>
  );
}
