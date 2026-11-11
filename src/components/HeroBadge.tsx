"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";
import type { BadgeScene } from "@/components/badge/scene";

/** A still of the 3D badge at rest, rendered from the same scene. */
const STILL = "/hero/cracha.webp";

const wantsScene = () =>
  window.matchMedia("(min-width: 768px)").matches && !prefersReducedMotion();

/**
 * Hero object: an acrylic ID badge with Pedro's photo, hanging from a
 * lanyard that runs up off the screen.
 * - Desktop: a real 3D scene (three.js) with the strap simulated as a rope.
 *   It drops in on its strap once the intro clears, and scrolling turns it
 *   round to its back. It only renders while something moves.
 * - Phones (and if WebGL is unavailable): a still rendered from that same
 *   scene, which drops in and swings to rest.
 */
export default function HeroBadge() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const still = useRef<HTMLDivElement>(null);
  const scene = useRef<BadgeScene | null>(null);
  const loading = useRef<Promise<BadgeScene | null> | null>(null);
  const progress = useRef(0);
  const { t } = useI18n();
  const copy = t.hero.badge;

  // Build the 3D scene early (at idle, during the intro) so it is ready to drop in.
  useEffect(() => {
    const host = stage.current;
    if (!host || !wantsScene()) return;
    let cancelled = false;
    const fallback = () => {
      scene.current?.dispose();
      scene.current = null;
      if (still.current) still.current.style.opacity = "1";
    };
    loading.current = new Promise<BadgeScene | null>((resolve) => {
      const go = () =>
        import("@/components/badge/scene")
          .then(({ createBadgeScene }) => createBadgeScene(host, copy, { onLost: fallback }))
          .then((s) => {
            if (cancelled) {
              s.dispose();
              return resolve(null);
            }
            scene.current = s;
            s.setTurn(progress.current);
            if (process.env.NODE_ENV === "development") {
              (window as unknown as { __badgeSnapshot?: BadgeScene["snapshot"] }).__badgeSnapshot = s.snapshot;
            }
            resolve(s);
          })
          .catch((err) => {
            if (process.env.NODE_ENV === "development") console.warn("[HeroBadge] 3D scene failed", err);
            resolve(null);
          });
      if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 });
      else setTimeout(go, 200);
    });
    const io = new IntersectionObserver(([e]) => scene.current?.setActive(e.isIntersecting));
    io.observe(host);
    return () => {
      cancelled = true;
      io.disconnect();
      scene.current?.dispose();
      scene.current = null;
      loading.current = null;
    };
  }, [copy]);

  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) return;
      gsap.set("[data-badge]", { autoAlpha: 0 });
      gsap.set("[data-hello]", { scale: 0.4, rotate: -24, autoAlpha: 0 });

      const hello = () =>
        gsap.to("[data-hello]", { scale: 1, rotate: -6, autoAlpha: 1, duration: 0.8, ease: "back.out(2.2)", delay: 1.1 });
      // The still: drops in and swings on its strap, pivoting at the top.
      const dropStill = () => {
        gsap.set("[data-badge]", { autoAlpha: 1 });
        gsap
          .timeline()
          .fromTo("[data-badge-swing]", { yPercent: -70 }, { yPercent: 0, duration: 0.9, ease: "back.out(1.2)" }, 0)
          .fromTo(
            "[data-badge-swing]",
            { rotate: 9 },
            { rotate: 0, duration: 2.6, ease: "elastic.out(1, 0.32)" },
            0.15,
          );
        hello();
      };
      const play = contextSafe!(async () => {
        const pending = loading.current;
        // Give a slow scene a moment; past that, the still takes over.
        const s = pending
          ? await Promise.race([pending, new Promise<null>((r) => setTimeout(() => r(null), 1500))])
          : null;
        if (s) {
          if (still.current) still.current.style.opacity = "0";
          gsap.set("[data-badge]", { autoAlpha: 1 });
          s.enter();
          hello();
        } else {
          dropStill();
        }
      });

      const hero = root.current?.closest("section");
      // The turn runs over a short stretch of scroll, so the back shows
      // while the badge is still well in view.
      ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: () => `+=${window.innerHeight * 0.35}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          scene.current?.setTurn(self.progress);
        },
      });
      gsap
        .timeline({
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        })
        // It trails the page a little, so it is still in view as it turns.
        .to("[data-badge-fade]", { y: () => window.innerHeight * 0.4, ease: "none", duration: 1 }, 0)
        .to("[data-hello]", { autoAlpha: 0, duration: 0.15 }, 0.05)
        // Gone before the hero has left, so it never reaches an edge.
        .to("[data-badge-fade]", { opacity: 0, ease: "power1.in", duration: 0.35 }, 0.5);
      return whenIntroDone(play);
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      // A 3:4 stage hung from the top of the hero, wide enough for the swing;
      // the strap leaves through its top edge.
      className="pointer-events-none absolute right-[-20vw] top-0 aspect-[3/4] w-[104vw] md:right-[-2%] md:w-[clamp(20rem,40vw,40rem)]"
    >
      <div data-badge-fade className="absolute inset-0 will-change-transform">
        <div data-badge className="absolute inset-0">
          <div data-badge-swing className="absolute inset-0 origin-top">
            <div ref={still} className="absolute inset-0">
              <Image src={STILL} alt="" fill priority sizes="(min-width: 768px) 40vw, 104vw" className="object-contain" />
            </div>
            <div ref={stage} className="absolute inset-0" />
          </div>
          <span
            data-hello
            className="absolute right-[67%] top-[47%] z-20 whitespace-nowrap rounded-full bg-branco px-4 py-2 label text-[0.95rem] text-preto shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] md:text-base"
          >
            {t.hero.hello}
          </span>
        </div>
      </div>
    </div>
  );
}
