import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import CtaSection from "@/components/CtaSection";
import ArtGallery from "@/components/work/ArtGallery";
import ProofStack from "@/components/work/ProofStack";
import Halftone from "@/components/backgrounds/Halftone";
import AmbientLight from "@/components/backgrounds/AmbientLight";
import FilmGrain from "@/components/backgrounds/FilmGrain";
import SectionBackdrop from "@/components/backgrounds/SectionBackdrop";
import Noite from "@/components/backgrounds/Noite";
import SiteShowcase from "@/components/work/SiteShowcase";
import VideoShowcase from "@/components/work/VideoShowcase";
import { ambientes, arts, sites, videos } from "@/content/work";
import { papoDom } from "@/content/papoDom";
import Image from "next/image";
import Link from "next/link";
import HoverArrow from "@/components/ui/HoverArrow";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/trabalhos">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).pages.work.title } : {};
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-12 md:mb-16">
      <p className="label text-[0.95rem] text-fg/50">{label}</p>
      <h2 className="mt-6 max-w-[16ch] font-display text-[clamp(2rem,5vw,4.5rem)] leading-[1.02] text-fg">
        {title}
      </h2>
    </div>
  );
}

export default async function Trabalhos({ params }: PageProps<"/[lang]/trabalhos">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <>
      <PageHero page="work" background={<Halftone />}>
        <ProofStack items={arts} />
      </PageHero>

      {/* Featured case: a full project told from idea to launch. */}
      <section id="case-papo-dom" data-theme="preto" className="scroll-mt-24 px-6 pt-20 md:px-12 md:pt-28">
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
              className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-cine)] group-hover:scale-[1.04]"
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

      {/* Each section gets a quiet background of its own; SectionBackdrop fades
          it out at the edges so they hand over cleanly. */}
      <section id="direcao-visual" data-theme="preto" className="relative isolate scroll-mt-24 px-6 py-20 md:px-12 md:py-28">
        <SectionBackdrop>
          <AmbientLight anchor={{ x: 0.78, y: 0.12 }} pull={0.8} size="90vmax" />
        </SectionBackdrop>
        <SectionHead label={t.work.artsLabel} title={t.work.artsTitle} />
        <ArtGallery items={arts} />
        <div id="ambientacoes" className="mt-24 scroll-mt-24 md:mt-32">
          <SectionHead label={t.work.placesLabel} title={t.work.placesTitle} />
          <ArtGallery items={ambientes} />
        </div>
      </section>

      <section id="audiovisual" data-theme="preto" className="relative isolate scroll-mt-24 px-6 py-20 md:px-12 md:py-28">
        <SectionBackdrop>
          <FilmGrain />
        </SectionBackdrop>
        <SectionHead label={t.work.videosLabel} title={t.work.videosTitle} />
        <VideoShowcase items={videos} />
      </section>

      <section id="sites" data-theme="preto" className="relative isolate scroll-mt-24 px-6 py-20 md:px-12 md:py-28">
        <SectionBackdrop className="opacity-75">
          <Noite seed={5} />
        </SectionBackdrop>
        <SectionHead label={t.work.sitesLabel} title={t.work.sitesTitle} />
        <SiteShowcase items={sites} />
      </section>

      <CtaSection lang={lang} t={t} />
    </>
  );
}
