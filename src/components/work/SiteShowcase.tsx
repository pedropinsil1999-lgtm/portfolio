"use client";

import Image from "next/image";
import { useI18n } from "@/i18n/I18nProvider";
import type { Site } from "@/content/work";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Conversion sites, one per row: the screenshot beside the text that explains
 * it (index and sector on top, name, summary and link below).
 */
export default function SiteShowcase({ items }: { items: Site[] }) {
  const { lang, t } = useI18n();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 md:gap-20">
      {items.map((site, i) => (
        // Same idea as the videos: the screenshot on the left, its story on
        // the right (stacked on phones).
        <article
          key={site.slug}
          className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 lg:gap-14"
        >
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor={t.work.openSite}
            className="group block self-start"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem] border border-branco/10 bg-preto">
              <Image
                src={site.image}
                alt={site.name}
                fill
                sizes="(min-width: 1152px) 600px, (min-width: 768px) 52vw, 100vw"
                className="object-cover object-top opacity-85 transition-[opacity,transform] duration-700 ease-[var(--ease-cine)] group-hover:scale-[1.03] group-hover:opacity-100"
              />
            </div>
          </a>

          <div className="flex min-w-0 flex-col justify-between gap-6 md:py-1">
            <div>
              <span className="label text-[0.95rem] text-vermelho">{pad(i + 1)}</span>
              <p className="label mt-2 text-[0.85rem] text-fg/50 sm:text-[0.95rem]">{site.sector[lang]}</p>
            </div>
            <div>
              <h3 className="font-display text-xl leading-tight text-fg sm:text-2xl xl:text-3xl">{site.name}</h3>
              <div className="my-4 h-px w-10 bg-branco/20 sm:my-5" />
              <p className="max-w-md text-sm leading-relaxed text-fg/70 sm:text-base">{site.summary[lang]}</p>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full border border-fg/25 px-6 py-3 label text-[0.95rem] text-fg transition-colors hover:bg-fg hover:text-[var(--page-bg)]"
              >
                {t.work.openSite}
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
