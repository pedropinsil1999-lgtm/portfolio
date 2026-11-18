/**
 * Inline <head> script: decides before first paint how the intro runs.
 * Every full page load (open or refresh) plays the logo intro; client-side
 * navigation never re-runs it.
 * - data-intro="play": play it
 * - data-intro="done": skip (reduced motion)
 */
export const introBootScript = `try{document.documentElement.dataset.intro=matchMedia("(prefers-reduced-motion: reduce)").matches?"done":"play"}catch(e){document.documentElement.dataset.intro="done"}`;
