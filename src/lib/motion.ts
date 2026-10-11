"use client";

let introReleased = false;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Called by the intro as the curtain opens, so heroes can animate in sync. */
export function releaseIntro() {
  introReleased = true;
  window.dispatchEvent(new Event("intro:done"));
}

/** True while the intro curtain is still closed over the page. */
export function introPending() {
  const state = document.documentElement.dataset.intro;
  return !introReleased && (state === "play" || state === "resume");
}

/** Runs `cb` once the intro has opened (or right away if there is no intro). */
export function whenIntroDone(cb: () => void) {
  if (!introPending()) {
    cb();
    return () => {};
  }
  window.addEventListener("intro:done", cb, { once: true });
  return () => window.removeEventListener("intro:done", cb);
}
