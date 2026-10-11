import type { ReactNode } from "react";

const FADE = "linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)";

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
      style={{ maskImage: FADE, WebkitMaskImage: FADE }}
    >
      {children}
    </div>
  );
}
