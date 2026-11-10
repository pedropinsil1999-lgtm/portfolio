import Image from "next/image";
import Link from "next/link";
import HoverArrow from "@/components/ui/HoverArrow";
import { papoDom } from "@/content/papoDom";
import type { Locale } from "@/i18n/config";

/** The Papo Dom case as a single card that opens its page (Home and Work). */
export default function FeaturedCase({ lang, id, className }: { lang: Locale; id?: string; className?: string }) {
  return (
    <section id={id} data-theme="preto" className={`scroll-mt-24 ${className ?? ""}`}>
      <Link
        href={`/${lang}/trabalhos/${papoDom.slug}`}
        data-cursor={papoDom.cta[lang]}
        className="group/arrow group grid items-center gap-8 overflow-hidden rounded-[2rem] border border-branco/10 bg-grafite/40 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-12 md:p-12"
      >
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[22rem] overflow-hidden rounded-[1.25rem]">
          <Image
            src={papoDom.cover}
            alt={papoDom.title}
            fill
            sizes="(min-width: 768px) 22rem, 90vw"
            className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-cine)] group-hover:scale-[1.03]"
          />
        </div>
        <div>
          <p className="label text-[0.95rem] text-vermelho">{papoDom.label[lang]}</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.92] text-fg">{papoDom.title}</h2>
          <p className="mt-3 font-script text-[clamp(1.6rem,3.4vw,2.8rem)] leading-none text-fg">{papoDom.subtitle[lang]}</p>
          <p className="mt-8 max-w-md text-base leading-relaxed text-fg/70 md:text-lg">{papoDom.lede[lang]}</p>
          <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-branco px-6 py-3 label text-[0.95rem] text-preto transition-colors group-hover:bg-vermelho">
            {papoDom.cta[lang]}
            <HoverArrow />
          </span>
        </div>
      </Link>
    </section>
  );
}
