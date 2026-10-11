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

/** Soft glow behind the script in the palette's light blue. */
export const scriptGlow = "[text-shadow:0_0_0.4em_rgb(194_232_255_/_0.28)]";
