import type { ReactNode } from "react";

// Painted on top in the page colour rather than used as a mask: same look,
// but no extra GPU pass every frame over the moving background.
const FADE = "linear-gradient(to bottom, var(--page-bg), transparent 18%, transparent 82%, var(--page-bg))";

/**
 * Holds a section's background effect behind its content and fades it in and
 * out at the top and bottom edges, so one section's effect hands over to the
 * next without a seam. The section itself needs `relative isolate`.
 */
export default function SectionBackdrop({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
    >
      {children}
      <div className="absolute inset-0" style={{ background: FADE }} />
    </div>
  );
}
