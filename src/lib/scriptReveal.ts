/**
 * Handwritten (script) accents are uncovered by a soft-edged mask sweeping
 * left to right, like ink spreading, while they come into focus. `--reveal`
 * is where the fade ends; the element sets `scriptRevealStyle` and GSAP tweens
 * from `scriptHidden` to `scriptShown`.
 */
const MASK = "linear-gradient(90deg, #000 calc(var(--reveal) - 30%), transparent var(--reveal))";

export const scriptRevealStyle = {
  maskImage: MASK,
  WebkitMaskImage: MASK,
  ["--reveal" as string]: "135%",
};

export const scriptHidden = { "--reveal": "0%", opacity: 0, filter: "blur(8px)" };
export const scriptShown = { "--reveal": "135%", opacity: 1, filter: "blur(0px)" };

/**
 * Drop the mask and filter once the script is fully written: a finished
 * `blur(0px)` or mask still costs a separate render pass every frame. Restored
 * as soon as the reveal runs backwards (scrubbed reveals).
 */
export function scriptSettle(el: Element | null, done: boolean) {
  if (!(el instanceof HTMLElement)) return;
  if (done) {
    el.style.filter = "none";
    el.style.maskImage = "none";
    el.style.setProperty("-webkit-mask-image", "none");
  } else if (el.style.maskImage === "none") {
    el.style.maskImage = MASK;
    el.style.setProperty("-webkit-mask-image", MASK);
  }
}

/** For scroll-scrubbed blur: at rest (no blur) remove the filter entirely. */
export function filterAtRest(el: Element | null, atRest: boolean) {
  if (atRest && el instanceof HTMLElement) el.style.filter = "none";
}

/** Soft glow behind the script in the palette's light blue. */
export const scriptGlow = "[text-shadow:0_0_0.4em_rgb(194_232_255_/_0.28)]";
