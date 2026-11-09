/** The PH monogram: a P whose bowl sits on the crossbar of an H. */
export const LOGO_PATH =
  "M0 0H26.09A28.26 28.26 0 0 1 26.09 56.52V60.87H73.86V0H100V100H73.86V82.61H26.09V100H0Z";

export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className} fill="currentColor">
      <path d={LOGO_PATH} />
    </svg>
  );
}
