import type { Locale } from "@/i18n/config";

type Localized = Record<Locale, string>;

/** The Papo Dom case (texts marked draft are to be confirmed by Pedro). */
export const papoDom = {
  slug: "papo-dom",
  site: "https://papodom.vercel.app",
  instagram: { handle: "@papo.dom", url: "https://www.instagram.com/papo.dom/" },
  cover: "/work/papo-dom/carrossel-01.webp",
  label: { pt: "Case · Evento", en: "Case · Event" },
  title: "Papo Dom",
  subtitle: { pt: "Conexões · 15ª edição", en: "Conexões · 15th edition" },
  lede: {
    pt: "Evento de Comunicação Social da UniDomBosco, idealizado e produzido pela turma do 4º período. O tema olha para os anos 2000: uma década, diferentes linguagens, uma mesma conexão.",
    en: "UniDomBosco's Social Communication event, conceived and produced by the 4th-semester class. The theme looks back at the 2000s: one decade, different languages, one same connection.",
  },
  facts: [
    { label: { pt: "Quando", en: "When" }, value: { pt: "27 e 28 de outubro de 2026", en: "27 and 28 October 2026" } },
    { label: { pt: "Onde", en: "Where" }, value: { pt: "AEDB · Resende, RJ", en: "AEDB · Resende, Brazil" } },
    {
      label: { pt: "Meu papel", en: "My role" },
      value: { pt: "Site, carrossel e vídeos de divulgação", en: "Website, carousel and promo videos" },
    },
  ] as { label: Localized; value: Localized }[],
  idea: {
    label: { pt: "A ideia", en: "The idea" },
    title: { pt: "Um sistema, quatro linguagens.", en: "One system, four languages." },
    text: {
      pt: "A identidade não tem uma logo única: é um sistema de quatro variações, cada uma ligada a uma linguagem visual da década (revista, TV, internet e scrapbook). As logos são da Leticia Coutinho; a partir delas, criei as peças de divulgação e o site do evento.",
      en: "The identity has no single logo: it is a system of four variations, each tied to a visual language of the decade (magazine, TV, internet and scrapbook). The logos are by Leticia Coutinho; from them I made the promotional pieces and the event's website.",
    },
  },
  carousel: {
    label: { pt: "Carrossel de lançamento", en: "Launch carousel" },
    title: { pt: "Uma marca, diferentes formas de se expressar.", en: "One brand, different ways to express itself." },
    text: {
      pt: "Cinco telas que contam como a identidade ganhou forma, cada uma vestida com uma das linguagens dos anos 2000.",
      en: "Five slides telling how the identity took shape, each dressed in one of the 2000s languages.",
    },
    slides: [1, 2, 3, 4, 5].map((n) => `/work/papo-dom/carrossel-0${n}.webp`),
  },
  videos: {
    label: { pt: "Motion e vídeo", en: "Motion and video" },
    title: { pt: "A divulgação em movimento.", en: "The promotion in motion." },
    items: [
      {
        slug: "turma",
        src: "/work/papo-dom/turma.mp4",
        poster: "/work/papo-dom/turma.jpg",
        title: { pt: "A turma", en: "The class" },
        about: {
          pt: "Pôster animado que apresenta a turma do 4º período que fez o evento.",
          en: "Animated poster introducing the 4th-semester class behind the event.",
        },
      },
      {
        slug: "baile-charme",
        src: "/work/papo-dom/baile-charme.mp4",
        poster: "/work/papo-dom/baile-charme.jpg",
        title: { pt: "Baile Charme", en: "Baile Charme" },
        about: {
          pt: "Chamada em vídeo para a atração de dança da programação.",
          en: "Video call-out for the dance act on the programme.",
        },
      },
      {
        slug: "final",
        src: "/work/papo-dom/final.mp4",
        poster: "/work/papo-dom/final.jpg",
        title: { pt: "Vídeo final", en: "Final video" },
        about: {
          pt: "Vídeo que fecha a campanha do Papo Dom 15.",
          en: "Video closing the Papo Dom 15 campaign.",
        },
      },
    ] as { slug: string; src: string; poster: string; title: Localized; about: Localized }[],
  },
  website: {
    label: { pt: "Site", en: "Website" },
    title: { pt: "O evento inteiro em uma página.", en: "The whole event on one page." },
    text: {
      pt: "Conceito, as quatro linguagens, a turma, o vídeo de apresentação, o local, as atrações com cronograma e os créditos, com cada seção vestida na linguagem que ela representa.",
      en: "Concept, the four languages, the class, the presentation video, the venue, the acts with the schedule and the credits, each section dressed in the language it stands for.",
    },
    shots: [
      "/work/papo-dom/site-hero.webp",
      "/work/papo-dom/site-manifesto.webp",
      "/work/papo-dom/site-linguagens.webp",
    ],
  },
  credits: {
    pt: "Realização: turma do 4º período de Comunicação Social da AEDB · Logos: Leticia Coutinho",
    en: "Produced by the 4th-semester Social Communication class at AEDB · Logos: Leticia Coutinho",
  },
  cta: { pt: "Ver o case", en: "See the case" },
  back: { pt: "Voltar para trabalhos", en: "Back to work" },
};
