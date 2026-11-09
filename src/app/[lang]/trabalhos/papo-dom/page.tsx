import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CtaSection from "@/components/CtaSection";
import CaseCarousel from "@/components/work/CaseCarousel";
import HoverArrow from "@/components/ui/HoverArrow";
import { papoDom as c } from "@/content/papoDom";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/trabalhos/papo-dom">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: `${c.title} · ${c.subtitle[lang]}` } : {};
}

function Head({ label, title, text }: { label: string; title: string; text?: string }) {
  return (
    <div className="mb-12 grid gap-6 md:mb-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
      <div>
        <p className="label text-[0.95rem] text-fg/50">{label}</p>
        <h2 className="mt-6 max-w-[18ch] font-display text-[clamp(2rem,4.6vw,4rem)] leading-[1.02] text-fg">{title}</h2>
      </div>
      {text && <p className="max-w-md text-base leading-relaxed text-fg/70 md:text-lg">{text}</p>}
    </div>
  );
}

const pill =
  "group/arrow inline-flex items-center gap-2 rounded-full border border-fg/25 px-6 py-3 label text-[0.95rem] text-fg transition-colors hover:bg-fg hover:text-[var(--page-bg)]";

export default async function PapoDomCase({ params }: PageProps<"/[lang]/trabalhos/papo-dom">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <>
      {/* Opening: what it was, with the cover of the campaign beside it. */}
      <section data-theme="preto" className="px-6 pb-20 pt-32 md:px-12 md:pb-28 md:pt-40">
        <Link href={`/${lang}/trabalhos`} className="label text-[0.95rem] text-fg/50 transition-colors hover:text-fg">
          {"←︎"} {c.back[lang]}
        </Link>
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="label text-[0.95rem] text-vermelho">{c.label[lang]}</p>
            <h1 className="mt-4 font-display text-[clamp(3.25rem,11vw,9.5rem)] leading-[0.9] text-fg">{c.title}</h1>
            <p className="mt-4 font-script text-[clamp(2rem,5vw,4rem)] leading-none text-fg">{c.subtitle[lang]}</p>
            <p className="mt-10 max-w-xl text-lg leading-snug text-fg/80 md:text-xl">{c.lede[lang]}</p>
            <dl className="mt-10 grid max-w-xl gap-x-10 gap-y-5 sm:grid-cols-2">
              {c.facts.map((f) => (
                <div key={f.label.pt}>
                  <dt className="label text-[0.85rem] text-fg/50">{f.label[lang]}</dt>
                  <dd className="mt-1 text-base text-fg">{f.value[lang]}</dd>
                </div>
              ))}
              <div>
                <dt className="label text-[0.85rem] text-fg/50">Instagram</dt>
                <dd className="mt-1 text-base">
                  <a href={c.instagram.url} target="_blank" rel="noopener noreferrer" className="text-fg underline-offset-4 hover:underline">
                    {c.instagram.handle} {"↗︎"}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[26rem] overflow-hidden rounded-[1.5rem] border border-branco/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
            <Image src={c.cover} alt={`${c.title} | ${c.carousel.label[lang]}`} fill priority sizes="(min-width: 1024px) 26rem, 90vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section data-theme="preto" className="px-6 py-16 md:px-12 md:py-24">
        <Head label={c.idea.label[lang]} title={c.idea.title[lang]} text={c.idea.text[lang]} />
      </section>

      <section data-theme="preto" className="px-6 py-16 md:px-12 md:py-24">
        <Head label={c.carousel.label[lang]} title={c.carousel.title[lang]} text={c.carousel.text[lang]} />
        <CaseCarousel slides={c.carousel.slides} label={c.carousel.label[lang]} />
      </section>

      <section data-theme="preto" className="px-6 py-16 md:px-12 md:py-24">
        <Head label={c.videos.label[lang]} title={c.videos.title[lang]} />
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {c.videos.items.map((v) => (
            <article key={v.slug}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-branco/10 bg-grafite">
                <video
                  src={v.src}
                  poster={v.poster}
                  controls
                  playsInline
                  // Nothing downloads until play: the poster stands in.
                  preload="none"
                  aria-label={v.title[lang]}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-5 font-display text-xl leading-tight text-fg md:text-2xl">{v.title[lang]}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-fg/70 md:text-base">{v.about[lang]}</p>
            </article>
          ))}
        </div>
      </section>

      <section data-theme="preto" className="px-6 pb-20 pt-16 md:px-12 md:pb-28 md:pt-24">
        <Head label={c.website.label[lang]} title={c.website.title[lang]} text={c.website.text[lang]} />
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {c.website.shots.map((src, i) => (
            <a
              key={src}
              href={c.site}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor={t.work.openSite}
              className={`group block overflow-hidden rounded-[1rem] border border-branco/10 bg-preto ${i === 0 ? "md:col-span-2" : ""}`}
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={src}
                  alt={`${c.title} | ${c.website.label[lang]} ${i + 1}`}
                  fill
                  sizes={i === 0 ? "(min-width: 768px) 90vw, 100vw" : "(min-width: 768px) 45vw, 100vw"}
                  className="object-cover object-top opacity-90 transition-[opacity,transform] duration-700 ease-[var(--ease-cine)] group-hover:scale-[1.02] group-hover:opacity-100"
                />
              </div>
            </a>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href={c.site} target="_blank" rel="noopener noreferrer" className={pill}>
            {t.work.openSite}
          </a>
          <a href={c.instagram.url} target="_blank" rel="noopener noreferrer" className={pill}>
            {c.instagram.handle} <HoverArrow />
          </a>
        </div>
        <p className="mt-12 max-w-2xl label text-[0.9rem] text-fg/45">{c.credits[lang]}</p>
      </section>

      <CtaSection lang={lang} t={t} />
    </>
  );
}
