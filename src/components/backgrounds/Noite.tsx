"use client";

import { MENTA, NOITE } from "@/components/ui/CardBackdrop";
import { MeshGradient } from "@/components/ui/mesh-gradient";

/** The site's mesh gradients as a standalone background (for server pages). */
export default function Noite({ seed = 1, light = false }: { seed?: number; light?: boolean }) {
  return <MeshGradient {...(light ? MENTA : NOITE)} seed={seed} />;
}
