"use client";

import Image from "next/image";
import { useI18n } from "@/i18n/I18nProvider";
import type { Site } from "@/content/work";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Conversion sites as compact cards, side by side: a small screenshot and the
 * text that explains it, so the work reads before the picture.
 */
export default function SiteShowcase({ items }: { items: Site[] }) {
  const { lang, t } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-10 lg:gap-16">
      {items.map((site, i) => (
        <article key={site.slug} className="flex flex-col">
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor={t.work.openSite}
            className="group block"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem] border border-branco/10 bg-preto">
              <Image
                src={site.image}
                alt={site.name}
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover object-top opacity-85 transition-[opacity,transform] duration-700 ease-[var(--ease-cine)] group-hover:scale-[1.03] group-hover:opacity-100"
              />
            </div>
          </a>
          <div className="mt-5 flex items-baseline justify-between gap-4">
            <div>
              <p className="label text-[0.95rem] text-fg/50">{site.sector[lang]}</p>
              <h3 className="mt-2 font-display text-xl text-fg md:text-2xl">{site.name}</h3>
            </div>
            <span className="label text-[0.95rem] text-fg/40">{pad(i + 1)}</span>
          </div>
          <p className="mt-4 max-w-md text-base leading-relaxed text-fg/70">{site.summary[lang]}</p>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 self-start rounded-full border border-fg/25 px-6 py-3 label text-[0.95rem] text-fg transition-colors hover:bg-fg hover:text-[var(--page-bg)]"
          >
            {t.work.openSite}
          </a>
        </article>
      ))}
    </div>
  );
}
