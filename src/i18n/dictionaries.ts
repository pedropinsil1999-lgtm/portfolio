import type { Locale } from "./config";

type Card = {
  index: string;
  title: [string, string];
  text: string;
  tags: string[];
};

type Placeholder = { title: string; index: string; note: string };

export type Dictionary = {
  meta: { title: string; description: string };
  nav: { home: string; work: string; about: string; contact: string; switchLanguage: string };
  intro: { label: string; choose: string; chooseOther: string; enter: string };
  hero: { kicker: string; tagline: string; scroll: string };
  cv: {
    label: string;
    title: string;
    group: string;
    meta: string;
    cursor: string;
    versions: Record<Locale, { label: string; cta: string }>;
  };
  /** `highlight` closes `text`, written in script and revealed last. */
  statement: { label: string; text: string; highlight: string };
  services: { label: string; cta: string; reelSoon: string; cards: Card[] };
  cta: { label: string; title: string; button: string };
  footer: { backToTop: string };
  work: {
    artsLabel: string;
    artsTitle: string;
    videosLabel: string;
    videosTitle: string;
    videoSoon: string;
    sitesLabel: string;
    sitesTitle: string;
    view: string;
    openSite: string;
    shuffle: string;
    shuffleHint: string;
    viewer: { close: string; prev: string; next: string };
  };
  pages: { work: Placeholder; about: Placeholder; contact: Placeholder };
  about: {
    now: string;
    nowText: string;
    milestones: { date: string; text: string }[];
  };
  contact: {
    whatsapp: string;
    preferred: string;
    linkedin: string;
    email: string;
    cv: string;
    cvMeta: string;
  };
};

const pt: Dictionary = {
  meta: {
    title: "Pedro Henrique | Designer de Comunicação",
    description:
      "Portfólio de Pedro Henrique, designer de comunicação em Resende, RJ. Direção visual, audiovisual e sites de conversão.",
  },
  nav: {
    home: "Início",
    work: "Trabalhos",
    about: "Sobre",
    contact: "Contato",
    switchLanguage: "Ver o site em inglês",
  },
  intro: {
    label: "Pedro Henrique | Portfólio",
    choose: "Escolha seu idioma",
    chooseOther: "Choose your language",
    enter: "Entrar",
  },
  hero: {
    kicker: "Designer de Comunicação | Resende, RJ",
    tagline: "Direção visual, audiovisual e sites que levam à próxima ação.",
    scroll: "Rolar ↓\uFE0E",
  },
  cv: {
    label: "Currículo",
    title: "Meu currículo, no seu idioma.",
    group: "Idioma do currículo",
    meta: "PDF · 1 página",
    cursor: "Baixar ↓\uFE0E",
    versions: {
      pt: { label: "Português", cta: "Baixar em português" },
      en: { label: "English", cta: "Baixar em inglês" },
    },
  },
  statement: {
    label: "Sobre o trabalho",
    text: "Cada peça tem um trabalho a fazer: ser vista, ser entendida e levar ao",
    highlight: "próximo passo.",
  },
  services: {
    label: "O que eu faço",
    cta: "Ver trabalhos",
    reelSoon: "Reel em breve",
    cards: [
      {
        index: "01",
        title: ["Direção", "Visual"],
        text: "Campanhas e sistemas visuais com uma ideia clara no centro.",
        tags: ["Direção de arte", "Key visual", "Identidade", "Campanha"],
      },
      {
        index: "02",
        title: ["Áudio", "visual"],
        text: "Roteiro, captação e edição com ritmo do primeiro ao último segundo.",
        tags: ["Roteiro", "Captação", "Edição", "Motion"],
      },
      {
        index: "03",
        title: ["Sites de", "Conversão"],
        text: "Páginas que conduzem o visitante até a próxima ação.",
        tags: ["Landing pages", "UI", "Arquitetura de página", "Copy"],
      },
      {
        index: "04",
        title: ["Comunicação", "Industrial"],
        text: "Endomarketing na ArcelorMittal: campanhas internas feitas para serem entendidas por todos.",
        tags: ["Endomarketing", "Campanhas internas", "Comunicação interna"],
      },
    ],
  },
  cta: {
    label: "Próximo passo",
    title: "Tem uma vaga ou um projeto?",
    button: "Vamos conversar",
  },
  footer: { backToTop: "Voltar ao topo ↑\uFE0E" },
  work: {
    artsLabel: "Direção visual",
    artsTitle: "Peças com uma ideia no centro.",
    videosLabel: "Audiovisual",
    videosTitle: "Histórias com ritmo do começo ao fim.",
    videoSoon: "Em breve",
    sitesLabel: "Sites de conversão",
    sitesTitle: "Páginas com um caminho só.",
    view: "Ver",
    openSite: "Abrir site ↗\uFE0E",
    shuffle: "Embaralhar",
    shuffleHint: "Clique na pilha para embaralhar",
    viewer: { close: "Fechar", prev: "Anterior", next: "Próxima" },
  },
  pages: {
    work: {
      title: "Trabalhos",
      index: "01 | Trabalhos",
      note: "Direção visual e sites de conversão. Uma seleção do que faço quando a ideia precisa chegar inteira.",
    },
    about: {
      title: "Sobre",
      index: "02 | Sobre",
      note: "Designer de comunicação em Resende, RJ. Da comunicação corporativa à direção visual, ao vídeo e à web.",
    },
    contact: {
      title: "Contato",
      index: "03 | Contato",
      note: "Para vagas e projetos. Pelo WhatsApp eu respondo mais rápido.",
    },
  },
  about: {
    now: "Agora",
    nowText: "Estagiando na ArcelorMittal e cursando Comunicação Social.",
    milestones: [
      { date: "2022", text: "Começo a aprender design gráfico." },
      { date: "Dez 2023", text: "Concluo o ensino médio." },
      { date: "Fev 2025", text: "Entro em Comunicação Social na UniDomBosco-RJ." },
      { date: "Mar 2025", text: "Início do estágio de comunicação na Rio Medical Center." },
      { date: "Abr 2025", text: "Processo seletivo para estágio em comunicação." },
      { date: "Mai 2025", text: "Início do estágio de comunicação na ArcelorMittal." },
      { date: "Dez 2028", text: "Formatura em Comunicação Social." },
    ],
  },
  contact: {
    whatsapp: "WhatsApp",
    preferred: "Resposta mais rápida",
    linkedin: "LinkedIn",
    email: "E-mail",
    cv: "Currículo",
    cvMeta: "PDF · Português",
  },
};

const en: Dictionary = {
  meta: {
    title: "Pedro Henrique | Communication Designer",
    description:
      "Portfolio of Pedro Henrique, communication designer based in Resende, Brazil. Visual direction, film and conversion-focused websites.",
  },
  nav: {
    home: "Home",
    work: "Work",
    about: "About",
    contact: "Contact",
    switchLanguage: "Ver o site em português",
  },
  intro: {
    label: "Pedro Henrique | Portfolio",
    choose: "Choose your language",
    chooseOther: "Escolha seu idioma",
    enter: "Enter",
  },
  hero: {
    kicker: "Communication Designer | Resende, Brazil",
    tagline: "Visual direction, film and websites that lead to the next step.",
    scroll: "Scroll ↓\uFE0E",
  },
  cv: {
    label: "Résumé",
    title: "My résumé, in your language.",
    group: "Résumé language",
    meta: "PDF · 1 page",
    cursor: "Download ↓\uFE0E",
    versions: {
      pt: { label: "Português", cta: "Download in Portuguese" },
      en: { label: "English", cta: "Download in English" },
    },
  },
  statement: {
    label: "About the work",
    text: "Every piece has a job to do: be seen, be understood and lead to the",
    highlight: "next step.",
  },
  services: {
    label: "What I do",
    cta: "See the work",
    reelSoon: "Reel coming soon",
    cards: [
      {
        index: "01",
        title: ["Visual", "Direction"],
        text: "Campaigns and visual systems built around one clear idea.",
        tags: ["Art direction", "Key visual", "Identity", "Campaign"],
      },
      {
        index: "02",
        title: ["Film &", "Video"],
        text: "Script, shoot and edit, with rhythm from the first second to the last.",
        tags: ["Scriptwriting", "Filming", "Editing", "Motion"],
      },
      {
        index: "03",
        title: ["Conversion", "Websites"],
        text: "Pages that guide the visitor to the next step.",
        tags: ["Landing pages", "UI", "Page architecture", "Copy"],
      },
      {
        index: "04",
        title: ["Industrial", "Comms"],
        text: "Internal communications at ArcelorMittal: campaigns made to be understood by everyone.",
        tags: ["Internal marketing", "Internal campaigns", "Corporate comms"],
      },
    ],
  },
  cta: {
    label: "Next step",
    title: "Got a role or a project?",
    button: "Let's talk",
  },
  footer: { backToTop: "Back to top ↑\uFE0E" },
  work: {
    artsLabel: "Visual direction",
    artsTitle: "Pieces built around one idea.",
    videosLabel: "Audiovisual",
    videosTitle: "Stories with rhythm from start to finish.",
    videoSoon: "Coming soon",
    sitesLabel: "Conversion websites",
    sitesTitle: "Pages with a single path.",
    view: "View",
    openSite: "Open site ↗\uFE0E",
    shuffle: "Shuffle",
    shuffleHint: "Click the pile to shuffle",
    viewer: { close: "Close", prev: "Previous", next: "Next" },
  },
  pages: {
    work: {
      title: "Work",
      index: "01 | Work",
      note: "Visual direction and conversion websites. A selection of what I do when an idea needs to land whole.",
    },
    about: {
      title: "About",
      index: "02 | About",
      note: "Communication designer in Resende, Brazil. From corporate communications to visual direction, film and the web.",
    },
    contact: {
      title: "Contact",
      index: "03 | Contact",
      note: "For roles and projects. WhatsApp is where I reply fastest.",
    },
  },
  about: {
    now: "Now",
    nowText: "Interning at ArcelorMittal while studying Social Communication.",
    milestones: [
      { date: "2022", text: "I start learning graphic design." },
      { date: "Dec 2023", text: "I finish high school." },
      { date: "Feb 2025", text: "I start Social Communication at UniDomBosco-RJ." },
      { date: "Mar 2025", text: "Communications internship begins at Rio Medical Center." },
      { date: "Apr 2025", text: "Selection process for a communications internship." },
      { date: "May 2025", text: "Communications internship begins at ArcelorMittal." },
      { date: "Dec 2028", text: "Graduation in Social Communication." },
    ],
  },
  contact: {
    whatsapp: "WhatsApp",
    preferred: "Fastest reply",
    linkedin: "LinkedIn",
    email: "Email",
    cv: "Résumé",
    cvMeta: "PDF · English",
  },
};

const dictionaries: Record<Locale, Dictionary> = { pt, en };

export const getDictionary = (locale: Locale) => dictionaries[locale];
