"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import Logo from "@/components/ui/Logo";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";
import { GRAIN } from "@/lib/grain";

const STRAP = "pedro henrique · portfólio · ";

/**
 * Hero object: an ID badge with Pedro's photo, hanging from a lanyard that
 * runs up off the screen. Plain CSS 3D (no 3D engine), moved by a small
 * physics loop:
 * - Once the intro clears it drops in on its strap and swings to rest.
 * - Scrolling turns it round to its back (PH mark, what he does) and the
 *   scroll speed sets it swinging; a fine pointer tilts it a little.
 * - It only computes while the hero is on screen.
 */
export default function HeroBadge() {
  const root = useRef<HTMLDivElement>(null);
  const swing = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const kick = useRef(0);
  const { t } = useI18n();

  // Entrance and scroll progress (GSAP); the motion itself lives in the loop below.
  useGSAP(
    (_, contextSafe) => {
      if (prefersReducedMotion()) return;
      gsap.set("[data-badge-drop]", { yPercent: -140, autoAlpha: 0 });
      gsap.set("[data-hello]", { scale: 0.4, rotate: -24, autoAlpha: 0 });
      const play = contextSafe!(() => {
        gsap
          .timeline({ delay: 0.25 })
          .to("[data-badge-drop]", { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out" }, 0)
          // It lands with a swing.
          .call(() => (kick.current = 26), [], 0.7)
          .to("[data-hello]", { scale: 1, rotate: -6, autoAlpha: 1, duration: 0.8, ease: "back.out(2.2)" }, 1.1);
      });
      const hero = root.current?.closest("section");
      // The turn runs over a short stretch of scroll, so the back shows
      // while the badge is still well in view.
      ScrollTrigger.create({
        trigger: hero,
        start: "top top",
        end: () => `+=${window.innerHeight * 0.35}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => (progress.current = self.progress),
      });
      gsap
        .timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true } })
        // It trails the page a little, so it is still in view as it turns.
        .to("[data-badge-fade]", { y: () => window.innerHeight * 0.4, ease: "none", duration: 1 }, 0)
        .to("[data-hello]", { autoAlpha: 0, duration: 0.15 }, 0.05)
        // Gone before the hero has left, so it never reaches an edge.
        .to("[data-badge-fade]", { opacity: 0, ease: "power1.in", duration: 0.35 }, 0.5);
      return whenIntroDone(play);
    },
    { scope: root },
  );

  // Physics: a damped pendulum for the swing, springs for the turn and tilt.
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let raf = 0;
    let last = 0;
    let visible = false;
    let lastY = window.scrollY;
    // swing angle and speed; turn and tilt with their speeds
    let a = 0, av = 0, ry = 0, ryv = 0, rx = 0, rxv = 0;
    const pointer = { x: 0, y: 0 };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;

      // Swing: scrolling pushes it the way the page moves; a slow idle sway.
      av += (kick.current + dy * 0.9) * 0.6;
      kick.current = 0;
      const sway = Math.sin(now / 1100) * 1.1;
      av += (-38 * (a - sway) - 3.2 * av) * dt;
      a = Math.max(-22, Math.min(22, a + av * dt));

      // Turn: round to the back as the page starts to move, plus the pointer's lean.
      const targetY = progress.current * 180 + pointer.x * 16;
      ryv += (-90 * (ry - targetY) - 15 * ryv) * dt;
      ry += ryv * dt;
      const targetX = -pointer.y * 10 + Math.max(-8, Math.min(8, dy * 0.25));
      rxv += (-90 * (rx - targetX) - 15 * rxv) * dt;
      rx += rxv * dt;

      if (swing.current) swing.current.style.transform = `rotate(${a.toFixed(2)}deg)`;
      if (card.current) card.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      if (glare.current) {
        // The light slides across the face as it turns.
        const k = ((((ry % 360) + 360) % 360) / 180) - 0.5;
        glare.current.style.transform = `translateX(${(k * 120).toFixed(1)}%)`;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        lastY = window.scrollY;
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    io.observe(el);
    const onVisibility = () => start();
    document.addEventListener("visibilitychange", onVisibility);
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const face = "absolute inset-0 overflow-hidden rounded-[7%/5%] [backface-visibility:hidden]";

  return (
    <div
      ref={root}
      aria-hidden="true"
      // Phones: in the flow above the name, which runs over its base.
      // Desktop: hanging to the right of the name.
      className="pointer-events-none relative -mb-[10vw] ml-auto mr-[3vw] w-[min(54vw,15rem)] [--strap:55vh] md:absolute md:right-[9%] md:top-[16%] md:mb-0 md:mr-0 md:w-[clamp(13rem,19vw,19rem)] md:[--strap:75vh]"
    >
      <div data-badge-fade className="will-change-transform">
        <div data-badge-drop>
          {/* Pivot at the top of the strap, off the screen. */}
          <div ref={swing} className="relative will-change-transform" style={{ transformOrigin: "50% calc(-1 * var(--strap))" }}>
            {/* Lanyard */}
            <div className="absolute bottom-[96%] left-1/2 w-[24%] -translate-x-1/2 overflow-hidden bg-grafite shadow-[inset_0_0_0_1px_rgb(234_255_255_/_0.08)]" style={{ height: "var(--strap)" }}>
              <p className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap label text-[0.62rem] leading-none text-branco/55 [writing-mode:vertical-rl] md:text-[0.7rem]">
                {STRAP.repeat(12)}
              </p>
              <span className="absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-branco/10 to-transparent" />
            </div>
            {/* Metal clip */}
            <div className="absolute left-1/2 top-[-5%] z-10 h-[9%] w-[16%] -translate-x-1/2 rounded-[30%] bg-[linear-gradient(90deg,#7a8c97,#e7f1f6_45%,#93a6b1_70%,#5d6f7a)] shadow-[0_4px_10px_rgb(0_0_0_/_0.35)]">
              <span className="absolute left-1/2 top-[55%] h-[30%] w-[45%] -translate-x-1/2 rounded-full bg-preto/60" />
            </div>

            <div className="relative [perspective:1100px]">
              <div ref={card} className="relative aspect-[5/7] [transform-style:preserve-3d] will-change-transform [container-type:inline-size]">
                {/* Front: the ID */}
                <div className={`${face} bg-branco text-preto shadow-[0_30px_60px_-20px_rgb(0_0_0_/_0.65)]`}>
                  <span className="absolute left-1/2 top-[3.5%] h-[3.2%] w-[22%] -translate-x-1/2 rounded-full bg-preto/75" />
                  <div className="absolute inset-x-[7%] top-[10%] flex items-center justify-between">
                    <Logo className="h-[7cqw] w-[7cqw] text-preto" />
                    <span className="label text-[5cqw] text-preto/60">{t.hero.badge.label}</span>
                  </div>
                  <div className="absolute inset-x-[7%] top-[18%] aspect-[1/0.76] overflow-hidden rounded-[6cqw] bg-grafite">
                    <Image
                      src="/hero/pedro-natural.webp"
                      alt=""
                      fill
                      priority
                      sizes="(min-width: 768px) 19vw, 54vw"
                      className="object-cover object-[50%_18%]"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_45%_35%,transparent_40%,rgb(4_42_65_/_0.55)_100%)]" />
                  </div>
                  <div className="absolute inset-x-[7%] top-[67%]">
                    <p className="font-display text-[10cqw] leading-[0.95]">Pedro</p>
                    <p className="-mt-[2cqw] pl-[4cqw] font-script text-[11.5cqw] leading-none text-preto/85">Henrique</p>
                  </div>
                  <div className="absolute inset-x-[7%] bottom-[5%] flex items-end justify-between gap-2">
                    <p className="label text-[4.4cqw] leading-tight text-preto/60">
                      {t.hero.badge.role}
                      <br />
                      {t.hero.badge.place}
                    </p>
                    {/* Code stripes, like a pass */}
                    <span className="h-[8cqw] w-[24cqw] bg-[repeating-linear-gradient(90deg,#042a41_0_2px,transparent_2px_4px,#042a41_4px_5px,transparent_5px_8px)] opacity-70" />
                  </div>
                  {/* Light sliding across the face as it turns */}
                  <div ref={glare} className="absolute inset-y-0 -left-1/2 w-[200%] bg-[linear-gradient(105deg,transparent_40%,rgb(255_255_255_/_0.45)_50%,transparent_60%)] mix-blend-soft-light" />
                </div>

                {/* Back: the mark and what he does */}
                <div className={`${face} bg-grafite text-branco shadow-[inset_0_0_0_1px_rgb(234_255_255_/_0.14)] [transform:rotateY(180deg)]`}>
                  <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "120px 120px" }} />
                  <span className="absolute left-1/2 top-[3.5%] h-[3.2%] w-[22%] -translate-x-1/2 rounded-full bg-preto/70" />
                  <Logo className="absolute left-1/2 top-[22%] h-[40cqw] w-[40cqw] -translate-x-1/2 text-branco" />
                  <ul className="absolute inset-x-[9%] bottom-[9%] space-y-[2cqw] label text-[5.4cqw] text-branco/80">
                    {t.hero.badge.skills.map((s) => (
                      <li key={s} className="flex items-center gap-[2.5cqw]">
                        <span className="h-[1.6cqw] w-[1.6cqw] rounded-full bg-vermelho" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <span
              data-hello
              className="absolute right-[-12%] top-[22%] z-20 rounded-full bg-branco px-4 py-2 label text-[0.95rem] text-preto shadow-[0_12px_30px_-10px_rgba(0,0,0,0.6)] md:text-base"
            >
              {t.hero.hello}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
