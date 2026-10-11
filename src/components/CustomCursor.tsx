"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const DOT = 14;
const RING = 44;
const PILL_H = 36;
const PILL_PAD = 36;

/**
 * Site cursor: a small glass dot that trails the pointer. Over links and
 * buttons it swells into a ring; over anything with `data-cursor="Label"` it
 * morphs into a pill showing that label. Mouse/trackpad only — touch devices
 * keep their native behaviour.
 */
export default function CustomCursor() {
  const root = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [pillWidth, setPillWidth] = useState(0);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = root.current;
    if (!el) return;

    const html = document.documentElement;
    html.classList.add("has-custom-cursor");
    setEnabled(true);

    const duration = prefersReducedMotion() ? 0 : 0.18;
    const xTo = gsap.quickTo(el, "x", { duration, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration, ease: "power3.out" });

    let last = { x: 0, y: 0 };
    const readTarget = (el: Element | null) => {
      const target = el?.closest?.("[data-cursor], a, button, [role='radio'], label");
      setInteractive(!!target);
      setLabel(target?.getAttribute("data-cursor") ?? null);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = { x: e.clientX, y: e.clientY };
      xTo(e.clientX);
      yTo(e.clientY);
      setVisible(true);
      readTarget(e.target as Element | null);
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    // A click can change what sits under a still pointer (e.g. the CV sheets
    // swapping), so re-read the element there once the UI has updated.
    const onUp = () => {
      setPressed(false);
      setTimeout(() => readTarget(document.elementFromPoint(last.x, last.y)), 60);
    };

    // Scrolling moves content under a still pointer; keep the label in sync.
    // A hit test needs fresh layout, so it runs a few times a second rather
    // than on every scroll frame.
    let scrollTimer = 0;
    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        scrollTimer = 0;
        readTarget(document.elementFromPoint(last.x, last.y));
      }, 100);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    html.addEventListener("pointerleave", onLeave);

    return () => {
      html.classList.remove("has-custom-cursor");
      window.clearTimeout(scrollTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      html.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Pill width follows the label text.
  useLayoutEffect(() => {
    if (label && measure.current) setPillWidth(measure.current.offsetWidth + PILL_PAD);
  }, [label]);

  const size = label
    ? { width: pillWidth, height: PILL_H }
    : interactive
      ? { width: RING, height: RING }
      : { width: DOT, height: DOT };

  return (
    <div
      ref={root}
      aria-hidden="true"
      hidden={!enabled}
      className="site-cursor pointer-events-none fixed left-0 top-0 z-[200]"
    >
      <div
        style={size}
        className={cn(
          "flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full",
          "transition-[width,height,background-color,opacity,scale] duration-300 ease-[var(--ease-cine)]",
          // Resting dot is the red signal; ring and pill stay neutral.
          label ? "bg-fg" : interactive ? "bg-fg/20" : "bg-vermelho",
          visible ? "opacity-100" : "opacity-0",
          pressed ? "scale-[0.85]" : "scale-100",
        )}
      >
        <span
          className={cn(
            "whitespace-nowrap label text-[0.95rem] text-[var(--page-bg)] transition-[opacity,scale] duration-300",
            label ? "scale-100 opacity-100 delay-100" : "scale-[0.6] opacity-0",
          )}
        >
          {label}
        </span>
      </div>
      {/* Off-screen copy used to measure the label width */}
      <span
        ref={measure}
        className="invisible absolute whitespace-nowrap label text-[0.95rem]"
      >
        {label}
      </span>
    </div>
  );
}
