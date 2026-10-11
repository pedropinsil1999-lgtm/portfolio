import Image from "next/image";
import { cn } from "@/lib/utils";

export type Preview =
  | { kind: "art"; images: string[] }
  | { kind: "site"; images: string[] }
  | { kind: "reel"; label: string };

// Resting and hovered poses for up to three layered thumbnails.
const fan = [
  "-translate-x-[50%] rotate-[-8deg] group-hover/preview:-translate-x-[64%] group-hover/preview:rotate-[-11deg]",
  "z-10 -translate-y-[4%] group-hover/preview:-translate-y-[10%]",
  "translate-x-[50%] rotate-[8deg] group-hover/preview:translate-x-[64%] group-hover/preview:rotate-[11deg]",
];
const cascade = [
  "-translate-x-[14%] -translate-y-[22%] scale-[0.88] opacity-60 group-hover/preview:-translate-x-[20%] group-hover/preview:-translate-y-[32%]",
  "-translate-y-[2%] scale-[0.94] opacity-80 group-hover/preview:-translate-y-[6%]",
  "z-10 translate-x-[14%] translate-y-[18%] group-hover/preview:translate-x-[20%] group-hover/preview:translate-y-[26%]",
];

const move = "transition-[translate,rotate,scale,opacity] duration-700 ease-[var(--ease-cine)]";

/**
 * Small preview of the work behind a service card: a fan of pieces, a
 * cascade of site screenshots, or a player frame while the reel is pending.
 * Reacts to hovering the preview itself (`group/preview`), not the whole card.
 */
export default function CardPreview({ preview }: { preview: Preview }) {
  if (preview.kind === "reel") {
    return (
      <div className="group/preview relative aspect-video w-[min(62vw,26rem)] overflow-hidden rounded-[1.25rem] border border-branco/15 bg-preto/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-branco/30 transition-transform duration-700 ease-[var(--ease-cine)] group-hover/preview:scale-110">
            <span className="ml-1 h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-branco" />
          </span>
        </div>
        <div className="absolute inset-x-5 bottom-4 flex items-center gap-4 label text-sm text-branco/60">
          <span>00:00:12:04</span>
          <span className="relative h-px flex-1 overflow-hidden bg-branco/20">
            <span className="reel-progress absolute inset-y-0 left-0 bg-vermelho" />
          </span>
          <span>{preview.label}</span>
        </div>
      </div>
    );
  }

  const isArt = preview.kind === "art";
  const poses = isArt ? fan : cascade;
  const images = preview.images.slice(0, 3);
  // Two images: use the outer poses so they still read as a pair.
  const pose = (i: number) => (images.length === 2 ? poses[i === 0 ? 0 : 2] : poses[i]);

  return (
    <div
      className={cn(
        "group/preview relative",
        isArt ? "aspect-[4/5] w-[min(32vw,12rem)]" : "aspect-[16/10] w-[min(62vw,20rem)]",
      )}
    >
      {images.map((src, i) => (
        <div
          key={src}
          className={cn(
            "absolute inset-0 overflow-hidden rounded-xl border border-branco/10 bg-preto shadow-[0_24px_50px_-20px_rgba(0,0,0,0.7)]",
            move,
            pose(i),
          )}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes={isArt ? "12rem" : "20rem"}
            className="object-cover object-top"
          />
        </div>
      ))}
    </div>
  );
}
