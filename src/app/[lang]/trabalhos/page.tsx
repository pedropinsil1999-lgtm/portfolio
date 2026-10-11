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
import { arts, sites, videos } from "@/content/work";
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

      {/* Each section gets a quiet background of its own; SectionBackdrop fades
          it out at the edges so they hand over cleanly. */}
      <section id="direcao-visual" data-theme="preto" className="relative isolate scroll-mt-24 px-6 py-20 md:px-12 md:py-28">
        <SectionBackdrop>
          <AmbientLight anchor={{ x: 0.78, y: 0.12 }} pull={0.8} size="90vmax" />
        </SectionBackdrop>
        <SectionHead label={t.work.artsLabel} title={t.work.artsTitle} />
        <ArtGallery items={arts} />
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
