"use client";

import { MeshGradient } from "@/components/ui/mesh-gradient";
import { GRAIN } from "@/lib/grain";

// Card background: a dark indigo mesh gradient ("Noite") that twists around the cursor.
export const NOITE = {
  colors: ["#120c46", "#1c1464", "#2b2290", "#3a2a9c"],
  intensity: 0.45,
  softness: 0.35,
  vignette: 0.35,
  cursor: true,
};

// Light field for the page itself (hero, section backgrounds): the mint of
// the identity, barely moving.
export const MENTA = {
  colors: ["#a2ecc9", "#aaf2cf", "#cdf9e5", "#93e2be"],
  intensity: 0.45,
  softness: 0.35,
  vignette: 0,
  cursor: true,
};

/**
 * Animated background shared by the site's cards. Place it inside a
 * `relative isolate overflow-hidden` card; it sits behind the content.
 */
export default function CardBackdrop({
  seed = 1,
  active = true,
  enabled = true,
}: {
  seed?: number;
  /** Animate (false keeps the last frame). */
  active?: boolean;
  /** Hold a GPU context at all (false shows the static look-alike). */
  enabled?: boolean;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <MeshGradient {...NOITE} seed={seed} active={active} enabled={enabled} />
      {/* Fine grain dithers the gradient so it never bands. */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "160px 160px" }}
      />
    </div>
  );
}
