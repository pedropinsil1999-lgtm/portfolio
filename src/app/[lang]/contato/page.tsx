import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactLinks from "@/components/contact/ContactLinks";
import Flashlight from "@/components/backgrounds/Flashlight";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/contato">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? { title: getDictionary(lang).pages.contact.title } : {};
}

export default function Contato() {
  return (
    <PageHero page="contact" background={<Flashlight />}>
      <ContactLinks />
    </PageHero>
  );
}
