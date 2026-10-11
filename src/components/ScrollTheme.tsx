"use client";

import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const themes = {
  // pill: header pills; on light sections they take the text colour.
  preto: { bg: "#042a41", fg: "#eaffff", pill: "#004671" },
  grafite: { bg: "#004671", fg: "#eaffff", pill: "#004671" },
  branco: { bg: "#eaffff", fg: "#042a41", pill: "#042a41" },
};
type ThemeName = keyof typeof themes;
type Theme = (typeof themes)[ThemeName];

/**
 * One continuous page background instead of hard-edged section fills.
 * Sections declare `data-theme`; as each one scrolls in, --page-bg/--page-fg
 * blend from the previous theme to its own (top of section from 75% to 25%
 * of the viewport), so colour changes read as a slow dissolve, never a cut.
 */
export default function ScrollTheme() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const main = document.querySelector("main");
    if (!main) return;

    let list: Theme[] = [];
    let current = "";
    let bounds: { start: number; end: number }[] = [];

    const apply = (y: number) => {
      if (!list.length) return;
      let { bg, fg, pill } = list[0];
      for (let i = 1; i < list.length; i++) {
        const { start, end } = bounds[i];
        if (y >= end) {
          ({ bg, fg, pill } = list[i]);
          continue;
        }
        if (y > start) {
          const p = (y - start) / (end - start);
          bg = gsap.utils.interpolate(list[i - 1].bg, list[i].bg, p);
          fg = gsap.utils.interpolate(list[i - 1].fg, list[i].fg, p);
          pill = gsap.utils.interpolate(list[i - 1].pill, list[i].pill, p);
        }
        break;
      }
      // Root variables restyle the whole page, so only write on a change
      // (i.e. while crossing between two themes), not on every scroll frame.
      if (bg + fg + pill === current) return;
      current = bg + fg + pill;
      html.style.setProperty("--page-bg", bg);
      html.style.setProperty("--page-fg", fg);
      html.style.setProperty("--pill-bg", pill);
    };

    // Re-read sections and their positions (new route, resize, refresh).
    // Next keeps recently visited routes mounted but hidden, so only count
    // sections that are actually rendered.
    const sync = () => {
      const sections = Array.from(main.querySelectorAll<HTMLElement>("[data-theme]")).filter(
        (s) => s.getClientRects().length > 0,
      );
      const vh = window.innerHeight;
      list = sections.map((s) => themes[s.dataset.theme as ThemeName] ?? themes.preto);
      bounds = sections.map((s) => {
        const top = s.getBoundingClientRect().top + window.scrollY;
        return { start: top - vh * 0.75, end: top - vh * 0.25 };
      });
      apply(window.scrollY);
    };

    sync();
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => apply(self.scroll()),
      onRefresh: sync,
    });
    // Route content is swapped inside <main>; re-sync as soon as it lands.
    // Batched to one re-measure per frame, however many nodes changed.
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    });
    observer.observe(main, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      trigger.kill();
    };
  }, []);

  return null;
}
