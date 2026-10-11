import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Timeline from "@/components/about/Timeline";
import AmbientLight from "@/components/backgrounds/AmbientLight";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/sobre">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).pages.about.title } : {};
}

export default function Sobre() {
  return (
    <PageHero page="about" background={<AmbientLight />}>
      <Timeline />
    </PageHero>
  );
}
