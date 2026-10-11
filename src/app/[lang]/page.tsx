import { notFound } from "next/navigation";
import HomeHero from "@/components/HomeHero";
import CvDownload from "@/components/CvDownload";
import ScrollText from "@/components/ScrollText";
import StackCards from "@/components/StackCards";
import CtaSection from "@/components/CtaSection";
import type { StackCard } from "@/components/StackCards";
import { arts, sites } from "@/content/work";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  // Each service card previews the related work and links to it on /trabalhos.
  const work = (anchor: string) => ({ href: `/${lang}/trabalhos#${anchor}`, label: t.services.cta });
  const art = (...slugs: string[]) => slugs.map((s) => arts.find((a) => a.slug === s)!.src);
  const extras: Pick<StackCard, "preview" | "link">[] = [
    { preview: { kind: "art", images: art("adolfz", "its-your-time", "bic") }, link: work("direcao-visual") },
    { preview: { kind: "reel", label: t.services.reelSoon }, link: work("audiovisual") },
    { preview: { kind: "site", images: sites.map((s) => s.image) }, link: work("sites") },
    { preview: { kind: "art", images: art("adocao", "criancas") }, link: work("direcao-visual") },
  ];

  return (
    <>
      <HomeHero />

      <CvDownload />

      <section data-theme="preto" className="px-6 py-24 md:px-12 md:py-36">
        <p className="mb-10 label text-[0.95rem] text-fg/50">{t.statement.label}</p>
        <ScrollText
          text={t.statement.text}
          highlight={t.statement.highlight}
          className="max-w-[22ch] font-display text-[clamp(1.75rem,4.6vw,4.25rem)] leading-[1.08] text-fg"
        />
      </section>

      <section data-theme="preto" className="px-4 pb-12 md:px-12 md:pb-16">
        <p className="mb-10 px-2 label text-[0.95rem] text-fg/50 md:px-0">
          {t.services.label}
        </p>
        <StackCards cards={t.services.cards.map((card, i) => ({ ...card, tone: "grafite", ...extras[i] }))} />
      </section>

      <CtaSection lang={lang} t={t} />
    </>
  );
}
