import Link from "next/link";
import Liquid from "@/components/backgrounds/Liquid";
import HoverArrow from "@/components/ui/HoverArrow";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Closing call to action shared by the pages; the background dissolves to a light liquid gradient. */
export default function CtaSection({ lang, t }: { lang: Locale; t: Dictionary }) {
  return (
    <section
      data-theme="branco"
      className="relative isolate flex min-h-svh flex-col items-center overflow-hidden justify-center px-6 py-32 text-center text-fg"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Liquid />
      </div>
      <p className="label text-[0.95rem] opacity-80">{t.cta.label}</p>
      <h2 className="mt-6 max-w-[14ch] font-display text-[clamp(2.25rem,7vw,6.5rem)] leading-[0.95]">
        {t.cta.title}
      </h2>
      <Link
        href={`/${lang}/contato`}
        className="group/arrow mt-12 inline-flex items-center gap-2 rounded-full bg-preto px-8 py-4 label text-base text-branco transition-colors hover:bg-vermelho"
      >
        {t.cta.button}
        <HoverArrow />
      </Link>
    </section>
  );
}
