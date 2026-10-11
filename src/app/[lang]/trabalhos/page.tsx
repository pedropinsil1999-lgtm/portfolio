import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import CtaSection from "@/components/CtaSection";
import ArtGallery from "@/components/work/ArtGallery";
import ProofStack from "@/components/work/ProofStack";
import Halftone from "@/components/backgrounds/Halftone";
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
    <div className="mb-16 md:mb-24">
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

      <section id="direcao-visual" data-theme="preto" className="scroll-mt-24 px-6 pb-40 pt-32 md:px-12 md:pb-56 md:pt-44">
        <SectionHead label={t.work.artsLabel} title={t.work.artsTitle} />
        <ArtGallery items={arts} />
      </section>

      <section id="audiovisual" data-theme="preto" className="scroll-mt-24 px-6 pb-40 pt-32 md:px-12 md:pb-56 md:pt-44">
        <SectionHead label={t.work.videosLabel} title={t.work.videosTitle} />
        <VideoShowcase items={videos} />
      </section>

      <section id="sites" data-theme="preto" className="scroll-mt-24 px-6 pb-32 pt-32 md:px-12 md:pb-44 md:pt-40">
        <SectionHead label={t.work.sitesLabel} title={t.work.sitesTitle} />
        <SiteShowcase items={sites} />
      </section>

      <CtaSection lang={lang} t={t} />
    </>
  );
}
