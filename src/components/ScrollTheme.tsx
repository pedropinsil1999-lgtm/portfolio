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
 *
 * Cost: a custom property changed on <html> restyles every element of the
 * page (several ms per frame, far more on phones). So the root only takes
 * the resting colours, once a blend has finished; mid-blend, the in-between
 * colours go inline on the few things on screen (the visible sections, the
 * footer, the page canvas and the header) and nothing else is touched.
 */
export default function ScrollTheme() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const main = document.querySelector("main");
    if (!main) return;
    const shell = main.closest<HTMLElement>(".page-shell");
    const header = document.querySelector<HTMLElement>(".site-header");

    let list: Theme[] = [];
    let sections: HTMLElement[] = [];
    let bounds: { start: number; end: number; top: number; bottom: number }[] = [];
    let rest = "";
    let current = "";
    let live: HTMLElement[] = [];
    // Plain backgrounds that follow the colour (not inherited: cheap to set).
    const canvases = () =>
      [html, document.body, shell, ...document.querySelectorAll<HTMLElement>(".edge-tint")].filter(
        (el): el is HTMLElement => !!el,
      );

    const setRoot = ({ bg, fg, pill }: Theme) => {
      if (bg + fg + pill === rest) return;
      rest = bg + fg + pill;
      html.style.setProperty("--page-bg", bg);
      html.style.setProperty("--page-fg", fg);
      html.style.setProperty("--pill-bg", pill);
    };
    const clearLive = () => {
      for (const el of live) {
        el.style.removeProperty("--page-bg");
        el.style.removeProperty("--page-fg");
      }
      live = [];
      for (const el of canvases()) el.style.removeProperty("background-color");
      header?.style.removeProperty("--pill-bg");
    };

    const apply = (y: number) => {
      if (!list.length) return;
      let theme = list[0];
      let blend: Theme | null = null;
      for (let i = 1; i < list.length; i++) {
        const { start, end } = bounds[i];
        if (y >= end) {
          theme = list[i];
          continue;
        }
        if (y > start) {
          const p = (y - start) / (end - start);
          const from = list[i - 1];
          const to = list[i];
          blend = {
            bg: gsap.utils.interpolate(from.bg, to.bg, p),
            fg: gsap.utils.interpolate(from.fg, to.fg, p),
            pill: gsap.utils.interpolate(from.pill, to.pill, p),
          };
        }
        break;
      }
      const key = blend ? blend.bg + blend.fg + blend.pill : theme.bg + theme.fg + theme.pill;
      if (key === current) return;
      current = key;

      if (!blend) {
        setRoot(theme);
        clearLive();
        return;
      }
      // Mid-blend: only what is on screen takes the in-between colours.
      const bottom = y + window.innerHeight;
      const next = sections.filter((_, i) => bounds[i].bottom > y && bounds[i].top < bottom);
      const footer = shell?.querySelector<HTMLElement>(":scope > footer");
      if (footer) next.push(footer);
      for (const el of live) {
        if (next.includes(el)) continue;
        el.style.removeProperty("--page-bg");
        el.style.removeProperty("--page-fg");
      }
      for (const el of next) {
        el.style.setProperty("--page-bg", blend.bg);
        el.style.setProperty("--page-fg", blend.fg);
      }
      live = next;
      for (const el of canvases()) el.style.backgroundColor = blend.bg;
      header?.style.setProperty("--pill-bg", blend.pill);
    };

    // Re-read sections and their positions (new route, resize, refresh).
    // Next keeps recently visited routes mounted but hidden, so only count
    // sections that are actually rendered.
    const sync = () => {
      sections = Array.from(main.querySelectorAll<HTMLElement>("[data-theme]")).filter(
        (s) => s.getClientRects().length > 0,
      );
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      list = sections.map((s) => themes[s.dataset.theme as ThemeName] ?? themes.preto);
      bounds = sections.map((s) => {
        const r = s.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const start = top - vh * 0.75;
        // A short last section never reaches 25%: finish at the page bottom instead.
        return { start, end: Math.max(start + 1, Math.min(top - vh * 0.25, max)), top, bottom: top + r.height };
      });
      current = "";
      apply(window.scrollY);
    };

    sync();
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => apply(self.scroll()),
      onRefresh: sync,
    });
    // A route swap replaces <main>'s children; re-sync as soon as it lands.
    // Only direct children: changes deeper in a page (captions, galleries)
    // never move the sections.
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    });
    observer.observe(main, { childList: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      trigger.kill();
      clearLive();
    };
  }, []);

  return null;
}
