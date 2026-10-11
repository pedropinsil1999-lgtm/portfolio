import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { Dela_Gothic_One, Dosis, Great_Vibes, Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Intro from "@/components/Intro";
import { InlineScript } from "@/components/InlineScript";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollTheme from "@/components/ScrollTheme";
import CustomCursor from "@/components/CustomCursor";
import { introBootScript } from "@/lib/introScript";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { I18nProvider } from "@/i18n/I18nProvider";
import "../globals.css";

const delaGothic = Dela_Gothic_One({
  variable: "--font-dela-gothic",
  weight: "400",
  subsets: ["latin"],
});

const dosis = Dosis({
  variable: "--font-dosis",
  subsets: ["latin"],
});

// Small labels, menu, counters and meta text (see .label).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Script accent: the handwritten "próximo passo" in the home statement.
const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta } = getDictionary(lang);
  return {
    title: { default: meta.title, template: "%s | Pedro Henrique" },
    description: meta.description,
    alternates: { languages: { "pt-BR": "/pt", en: "/en" } },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <html
      lang={lang === "pt" ? "pt-BR" : "en"}
      suppressHydrationWarning
      className={`${delaGothic.variable} ${dosis.variable} ${inter.variable} ${greatVibes.variable} antialiased`}
    >
      <head>
        <InlineScript html={introBootScript} />
      </head>
      <body className="font-sans">
        <I18nProvider lang={lang} t={t}>
          <SmoothScroll>
            <Intro />
            <ScrollTheme />
            <Header />
            <CustomCursor />
            {/* Each route swap rises over the previous page like a new card. */}
            <ViewTransition update="page-swap" default="none">
              <div className="page-shell">
                <main>{children}</main>
                <Footer />
              </div>
            </ViewTransition>
          </SmoothScroll>
        </I18nProvider>
      </body>
    </html>
  );
}
