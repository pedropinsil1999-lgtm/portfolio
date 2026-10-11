"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";
import type { Art } from "@/content/work";

// Pose by depth in the pile (0 = top): rotation (deg), offset (% of a print),
// and how much it follows the mouse. The top print sits almost straight.
const poses = [
  { r: -2, x: 0, y: 0, d: 1.4 },
  { r: 6, x: 14, y: -4, d: 1.1 },
  { r: -8, x: -16, y: 4, d: 0.9 },
  { r: 11, x: 26, y: 6, d: 0.75 },
  { r: -12, x: -28, y: -6, d: 0.6 },
  { r: 3, x: 4, y: 10, d: 0.5 },
];
const AUTO_EVERY = 3.5; // seconds between automatic shuffles

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The Work page opens on the pieces piled up like proofs on a table.
 * Clicking the pile sends the top print spinning to the back and the rest
 * settle; a caption beside it names the print on top. It shuffles slowly by
 * itself until someone interacts (paused on hover, off-screen or hidden tab).
 */
export default function ProofStack({ items }: { items: Art[] }) {
  const root = useRef<HTMLDivElement>(null);
  const { lang, t } = useI18n();
  const [order, setOrder] = useState(() => items.map((_, i) => i));
  const orderRef = useRef(order);
  const busy = useRef(false);
  const touched = useRef(false);
  const top = items[order[0]];

  /** Place every print at the pose of its depth in `next`. */
  const settle = (next: number[], duration: number) => {
    const prints = gsap.utils.toArray<HTMLElement>("[data-proof]", root.current);
    next.forEach((itemIndex, depth) => {
      const el = prints[itemIndex];
      const p = poses[depth % poses.length];
      gsap.set(el, { zIndex: next.length - depth });
      gsap.to(el, { xPercent: p.x, yPercent: p.y, rotation: p.r, duration, ease: "expo.out", overwrite: "auto" });
    });
  };

  const shuffle = () => {
    if (busy.current) return;
    busy.current = true;
    const current = orderRef.current;
    const next = [...current.slice(1), current[0]];
    const leaving = gsap.utils.toArray<HTMLElement>("[data-proof]", root.current)[current[0]];
    const reduced = prefersReducedMotion();

    const done = () => {
      orderRef.current = next;
      setOrder(next);
      settle(next, reduced ? 0 : 0.8);
      gsap.delayedCall(reduced ? 0 : 0.35, () => (busy.current = false));
    };
    if (reduced) return done();

    // Top print swings out to the side, then slides under the pile.
    gsap
      .timeline({ onComplete: done })
      .to(leaving, { xPercent: 78, yPercent: -8, rotation: 16, duration: 0.38, ease: "power2.in" })
      .set(leaving, { zIndex: 0 });
  };

  // Initial pile, entrance and mouse depth.
  useGSAP(
    () => {
      const prints = gsap.utils.toArray<HTMLElement>("[data-proof]");
      gsap.set(prints, { transformOrigin: "50% 50%" });
      settle(orderRef.current, 0);
      if (prefersReducedMotion()) return;

      const inners = prints.map((el) => el.firstElementChild as HTMLElement);
      gsap.set(inners, { yPercent: 30, autoAlpha: 0 });
      const offIntro = whenIntroDone(() =>
        gsap.to(inners, { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.07, delay: 0.25 }),
      );

      const layers = inners.map((el) => ({
        x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
      }));
      const onMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        orderRef.current.forEach((itemIndex, depth) => {
          const d = poses[depth % poses.length].d;
          layers[itemIndex].x(nx * 30 * d);
          layers[itemIndex].y(ny * 22 * d);
        });
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      return () => {
        offIntro();
        window.removeEventListener("pointermove", onMove);
      };
    },
    { scope: root },
  );

  // Slow autoplay until the visitor interacts.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = root.current;
    if (!el) return;
    let visible = true;
    let hovering = false;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);
    const enter = () => (hovering = true);
    const leave = () => (hovering = false);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    const id = window.setInterval(() => {
      if (!touched.current && visible && !hovering && !document.hidden) shuffle();
    }, AUTO_EVERY * 1000);
    return () => {
      window.clearInterval(id);
      io.disconnect();
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
    // shuffle only reads refs; the interval is set up once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClick = () => {
    touched.current = true;
    shuffle();
  };

  return (
    <div ref={root} data-proof-stack className="relative mb-10 h-full min-h-[58svh] w-full overflow-x-clip md:mb-0 md:min-h-0">
      {/* Caption: the print on top of the pile */}
      <div className="absolute bottom-0 left-0 z-20 max-w-[16rem] md:bottom-auto md:top-1/2 md:-translate-y-1/2">
        <p className="label text-[0.95rem] text-branco/50">
          <span className="text-vermelho">{pad(order[0] + 1)}</span> / {pad(items.length)}
        </p>
        <p key={`${top.slug}-k`} className="caption-in mt-4 label text-[0.95rem] text-branco/50">
          {top.kind[lang]}
        </p>
        <p key={`${top.slug}-t`} className="caption-in mt-2 font-display text-2xl leading-tight text-branco md:text-3xl">
          {top.title}
        </p>
        <p className="label mt-5 hidden text-[0.95rem] text-branco/40 md:block">{t.work.shuffleHint}</p>
      </div>

      {/* The pile */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`${t.work.shuffle}: ${top.title}`}
        data-cursor={t.work.shuffle}
        className="absolute left-1/2 top-[38%] aspect-[4/5] w-[min(44vw,13rem)] -translate-x-1/2 -translate-y-1/2 outline-none md:left-[64%] md:top-1/2"
      >
        {items.map((art, i) => (
          <div key={art.slug} data-proof className="absolute inset-0 will-change-transform">
            <div className="h-full w-full overflow-hidden rounded-[1.25rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
              <Image
                src={art.src}
                alt={i === order[0] ? `${art.title} | ${art.kind[lang]}` : ""}
                width={1080}
                height={1350}
                sizes="13rem"
                priority={i < 3}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </button>
    </div>
  );
}
