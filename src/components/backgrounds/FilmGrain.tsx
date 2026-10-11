import { GRAIN } from "@/lib/grain";

/**
 * Audiovisual section background: a fine film grain that flickers like
 * projected film, with a soft vignette. Pure CSS: the grain layer jumps
 * between offsets in steps (a composited transform on a layer only 20% larger
 * than the section, so its edges never show), so it costs next to
 * nothing. Still under reduced motion.
 */
export default function FilmGrain() {
  return (
    <div className="absolute inset-0">
      <div
        className="film-grain absolute -inset-[10%] opacity-[0.09] will-change-transform"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "200px 200px" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 40%, rgb(2 26 41 / 0.55) 100%)" }}
      />
    </div>
  );
}
