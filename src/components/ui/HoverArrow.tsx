/**
 * Arrow for pill buttons: on hover/focus of the nearest `group/arrow` parent it
 * turns to point up and out (↗), a small cue that the link takes you somewhere.
 */
export default function HoverArrow() {
  return (
    <span
      aria-hidden="true"
      className="inline-block transition-transform duration-500 ease-[var(--ease-cine)] group-hover/arrow:-rotate-45 group-focus-visible/arrow:-rotate-45"
    >
      {"→\uFE0E"}
    </span>
  );
}
