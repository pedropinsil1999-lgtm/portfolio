"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";

// A full turn of the 3D megaphone rendered as 48 frames (7.5° apart, shadow
// baked in), plus a soft copy of the first frame for the out-of-focus entry.
// Scrolling picks the frame: it looks like real 3D, with no 3D engine or GPU
// context on the page.
const FRAMES = 48;
const frame = (i: number) => `/hero/spin/${String(i).padStart(2, "0")}.webp`;
const SOFT = "/hero/spin/soft.webp";
// Turns per hero scroll: it leaves the screen about half way, so two turns
// over the whole hero show one full turn while it is in view.
const TURN = 2;

/**
 * Hero object: the megaphone, turning as the hero scrolls away.
 * - Enters from below and out of focus once the intro clears.
 * - Scrolling turns it (frames drawn into one canvas), lets it drop a little
 *   and fades it out before the hero has left.
 */
export default function HeroMegaphone() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const reduced = prefersReducedMotion();
      const cv = canvas.current;
      const ctx = cv?.getContext("2d");
      const images: HTMLImageElement[] = [];
      let ready = false;
      let current = -1;
      let progress = 0;

      const draw = () => {
        if (!ready || !cv || !ctx) return;
        const i = Math.min(FRAMES - 1, Math.round(progress * TURN * FRAMES) % FRAMES);
        if (i === current) return;
        current = i;
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(images[i], 0, 0, cv.width, cv.height);
      };

      // All frames are fetched and decoded after the intro, then the canvas
      // takes over from the still first frame.
      const load = () => {
        if (reduced || !cv || !ctx) return;
        const size = Math.min(1280, Math.round(cv.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2)));
        cv.width = cv.height = size;
        Promise.all(
          Array.from({ length: FRAMES }, (_, i) => {
            const img = new Image();
            img.decoding = "async";
            img.src = frame(i);
            images[i] = img;
            return img.decode();
          }),
        )
          .then(() => {
            ready = true;
            draw();
            cv.style.visibility = "visible";
            root.current?.querySelector<HTMLElement>("[data-mega-still]")?.style.setProperty("visibility", "hidden");
          })
          .catch(() => {});
      };

      if (reduced) return;
      gsap.set("[data-mega-enter]", { y: 40, autoAlpha: 0 });
      gsap.set("[data-mega-sharp]", { opacity: 0, willChange: "opacity" });
      gsap.set("[data-mega-soft]", { opacity: 1, willChange: "opacity" });
      const play = contextSafe!(() => {
        gsap
          .timeline({
            delay: 0.35,
            defaults: { duration: 1.6, ease: "expo.out" },
            onComplete: () => {
              gsap.set("[data-mega-soft]", { display: "none" });
              gsap.set("[data-mega-sharp]", { willChange: "auto" });
            },
          })
          .to("[data-mega-enter]", { y: 0, autoAlpha: 1 }, 0)
          .to("[data-mega-sharp]", { opacity: 1 }, 0.1)
          .to("[data-mega-soft]", { opacity: 0 }, 0.3);
        // Frames load once the entrance has started.
        window.setTimeout(load, 600);
      });

      const hero = root.current?.closest("section");
      gsap
        .timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate(self) {
              progress = self.progress;
              draw();
            },
          },
        })
        .to("[data-mega-drop]", { yPercent: 4, ease: "none", duration: 1 }, 0)
        // Gone before the hero has left, so it never reaches an edge.
        .to("[data-mega-fade]", { opacity: 0, ease: "power1.in", duration: 0.4 }, 0.35);

      return whenIntroDone(play);
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      // Phones: in the flow, right above the name and overlapping it a little,
      // so the object and the title read as one block. Desktop: floats to the
      // right of the name.
      className="pointer-events-none relative z-10 -mb-[9vw] -mr-[8vw] ml-auto w-[96vw] max-w-[30rem] md:absolute md:right-[3%] md:top-[10%] md:mb-0 md:ml-0 md:mr-0 md:w-[clamp(19rem,38vw,38rem)] md:max-w-none"
    >
      <div data-mega-enter>
        <div data-mega-fade>
          <div data-mega-drop className="relative aspect-square will-change-transform">
            <div data-mega-sharp className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-mega-still
                src={frame(0)}
                alt=""
                width={640}
                height={640}
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full select-none"
                draggable={false}
              />
              <canvas ref={canvas} className="absolute inset-0 h-full w-full" style={{ visibility: "hidden" }} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-mega-soft
              src={SOFT}
              alt=""
              width={320}
              height={320}
              decoding="async"
              className="absolute inset-0 h-full w-full select-none opacity-0"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
