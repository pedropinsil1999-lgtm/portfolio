"use client";

import { NOITE } from "@/components/ui/CardBackdrop";
import { MeshGradient } from "@/components/ui/mesh-gradient";

/** The "Noite" mesh gradient as a standalone background (for server pages). */
export default function Noite({ seed = 1 }: { seed?: number }) {
  return <MeshGradient {...NOITE} seed={seed} />;
}
