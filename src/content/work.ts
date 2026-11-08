import type { Locale } from "@/i18n/config";

type Localized = Record<Locale, string>;

export type Art = {
  slug: string;
  src: string;
  title: string;
  kind: Localized;
  /** Who it was for / where it ran. */
  client: Localized;
  /** Short explanation shown beside the piece in the viewer. */
  about: Localized;
  /** Intrinsic size when not the usual 1080×1350 (4:5). */
  size?: { w: number; h: number };
  /** Focus of the 4:5 thumbnail crop, for photos framed off-centre. */
  position?: string;
};

/** The pieces installed in place at ArcelorMittal (photos of the sites). */
export const ambientes: Art[] = [
  {
    slug: "ambientacao-aniversario",
    src: "/work/ambientacao-aniversario.webp",
    size: { w: 608, h: 1080 },
    position: "50% 45%",
    title: "17 anos em Resende",
    kind: { pt: "Ambientação", en: "Environmental graphics" },
    client: { pt: "ArcelorMittal · Resende", en: "ArcelorMittal · Resende" },
    about: {
      pt: "Banner do aniversário de 17 anos da unidade de Resende, instalado na área de circulação dos empregados. O degradê da marca leva a mensagem de agradecimento, e a foto da usina com dois empregados mostra quem faz essa trajetória.",
      en: "Banner for the Resende plant's 17th anniversary, set up where employees walk past every day. The brand gradient carries the thank-you message, and the photo of the plant with two employees shows who made that journey.",
    },
  },
  {
    slug: "ambientacao-acidente-zero",
    src: "/work/ambientacao-acidente-zero.webp",
    size: { w: 608, h: 1080 },
    position: "50% 55%",
    title: "Acidente Zero",
    kind: { pt: "Ambientação", en: "Environmental graphics" },
    client: { pt: "ArcelorMittal · segurança", en: "ArcelorMittal · safety" },
    about: {
      pt: "Painel de parede da campanha de segurança \"Acredite no zero\". A curva separa a foto da equipe da mensagem, e o círculo da marca destaca o número 1 da meta, que é acidente zero.",
      en: "Wall panel for the \"Believe in zero\" safety campaign. A curve separates the team photo from the message, and the brand circle highlights the number 1 of the goal: zero accidents.",
    },
  },
  {
    slug: "ambientacao-sipat",
    src: "/work/ambientacao-sipat.webp",
    size: { w: 608, h: 1080 },
    title: "SIPAT 2025",
    kind: { pt: "Ambientação", en: "Environmental graphics" },
    client: { pt: "ArcelorMittal · SIPAT", en: "ArcelorMittal · SIPAT" },
    about: {
      pt: "Painel da Semana Interna de Prevenção de Acidentes, com a frase \"Eu me cuido por:\" deixando espaço em branco para os empregados completarem. A peça vira um mural de respostas ao longo da semana.",
      en: "Panel for the internal accident prevention week, with the line \"I take care of myself for:\" leaving blank space for employees to fill in. Over the week the piece becomes a wall of their answers.",
    },
  },
  {
    slug: "ambientacao-mural",
    src: "/work/ambientacao-mural.webp",
    size: { w: 1080, h: 608 },
    position: "22% 50%",
    title: "Aços inteligentes",
    kind: { pt: "Ambientação", en: "Environmental graphics" },
    client: { pt: "ArcelorMittal · Resende", en: "ArcelorMittal · Resende" },
    about: {
      pt: "Mural de parede com o posicionamento da marca, \"Aços inteligentes para as pessoas e o planeta\". A ilustração liga pontos como uma constelação e a lona curva com a foto da usina fecha a composição no canto.",
      en: "Wall mural carrying the brand's line, \"Smart steels for people and the planet\". The illustration joins points like a constellation, and the curved panel with the plant photo closes the composition in the corner.",
    },
  },
];

export type Video = {
  slug: string;
  title: Localized;
  kind: Localized;
  /** Short explanation shown beside the video. */
  about: Localized;
  /** Vertical (9:16) file in /public/work; while missing, a placeholder shows. */
  src?: string;
  poster?: string;
};

export type Site = {
  slug: string;
  name: string;
  url: string;
  image: string;
  sector: Localized;
  summary: Localized;
};

/** Visual direction pieces (all 1080×1350, 4:5). */
export const arts: Art[] = [
  {
    slug: "its-your-time",
    src: "/work/its-your-time.png",
    title: "It's Your Time",
    kind: { pt: "Composição com IA", en: "AI composition" },
    client: { pt: "Walkee · conceito", en: "Walkee · concept" },
    about: {
      pt: "Anúncio conceitual para um app que conecta corredores mesmo à distância. A cena foi composta com imagem gerada por IA e finalizada com tratamento de cor e granulado; os comentários flutuando sobre a foto trazem a ideia de comunidade para dentro da imagem.",
      en: "Concept ad for an app that connects runners even when they're apart. The scene was composed from an AI-generated image and finished with colour grading and grain; the comments floating over the photo bring the idea of community into the picture.",
    },
  },
  {
    slug: "adolfz",
    src: "/work/adolfz.png",
    title: "Adolfz Stream",
    kind: { pt: "Identidade para streamer", en: "Streamer identity" },
    client: { pt: "Adolfz · canal na Twitch", en: "Adolfz · Twitch channel" },
    about: {
      pt: "Peça da identidade visual do canal do streamer Adolfz. A textura de plástico amassado, a faixa vermelha e o título com eco em contorno dão cara de material impresso, com o ícone da Twitch espalhado como adesivos.",
      en: "Part of the visual identity for streamer Adolfz's channel. The crumpled plastic texture, the red band and the echoed outline title give it the feel of printed matter, with the Twitch icon scattered like stickers.",
    },
  },
  {
    slug: "buhler",
    src: "/work/buhler.png",
    title: "Hotel Bühler",
    kind: { pt: "Peça institucional", en: "Institutional piece" },
    client: { pt: "Hotel Bühler · Visconde de Mauá", en: "Hotel Bühler · Visconde de Mauá" },
    about: {
      pt: "Post para um hotel histórico na serra. A luz quente, a madeira e o livro aberto traduzem a tradição da casa em imagem, e a chamada convida o hóspede a escrever a própria história ali.",
      en: "Post for a historic mountain hotel. Warm light, wood and an open book turn the house's tradition into an image, and the line invites guests to write their own story there.",
    },
  },
  {
    slug: "adocao",
    src: "/work/adocao.jpg",
    title: "Feira de Adoção",
    kind: { pt: "Campanha interna", en: "Internal campaign" },
    client: { pt: "ArcelorMittal · comunicação interna", en: "ArcelorMittal · internal comms" },
    about: {
      pt: "Comunicado para uma feira de adoção de animais na unidade de Barra Mansa. A foto ao fundo cria o clima, o cachorro em primeiro plano prende o olhar e o bloco de informações deixa data, horário e local fáceis de achar.",
      en: "Notice for a pet adoption fair at the Barra Mansa plant. The background photo sets the mood, the dog up front catches the eye and the info block keeps date, time and place easy to find.",
    },
  },
  {
    slug: "criancas",
    src: "/work/criancas.png",
    title: "Dia das Crianças",
    kind: { pt: "Campanha interna", en: "Internal campaign" },
    client: { pt: "ArcelorMittal · comunicação interna", en: "ArcelorMittal · internal comms" },
    about: {
      pt: "Convite para a manhã de recreação de Dia das Crianças para os filhos dos empregados. A peça organiza bastante informação (data, local, inscrição, vagas e transporte) em blocos claros, e a ilustração dá o tom leve.",
      en: "Invitation to a Children's Day morning of activities for employees' kids. The piece organises a lot of information (date, place, sign-up, places and transport) into clear blocks, while the illustration sets a playful tone.",
    },
  },
  {
    slug: "bic",
    src: "/work/bic.png",
    title: "BIC Cristal",
    kind: { pt: "Peça conceitual", en: "Concept piece" },
    client: { pt: "BIC · estudo", en: "BIC · study" },
    about: {
      pt: "Estudo para a BIC Cristal a partir da frase “ideias só existem de verdade quando ganham forma”. As canetas saem do quadro como se o tivessem desenhado, e o balão feito à mão fecha o raciocínio.",
      en: "Study for BIC Cristal built on the line “ideas only truly exist once they take shape”. The pens rise out of the frame as if they had drawn it, and the hand-drawn bubble completes the thought.",
    },
  },
];

/** Audiovisual pieces, vertical 9:16. Placeholders until the files arrive. */
export const videos: Video[] = [
  {
    slug: "video-01",
    title: { pt: "Vídeo 01", en: "Video 01" },
    kind: { pt: "Roteiro, captação e edição", en: "Script, shoot and edit" },
    about: {
      pt: "Texto provisório: aqui entra o contexto do vídeo, para quem foi feito, o que você fez e o resultado.",
      en: "Placeholder: the video's context, who it was for, what you did and the result go here.",
    },
  },
  {
    slug: "video-02",
    title: { pt: "Vídeo 02", en: "Video 02" },
    kind: { pt: "Edição e motion", en: "Edit and motion" },
    about: {
      pt: "Texto provisório: aqui entra o contexto do vídeo, para quem foi feito, o que você fez e o resultado.",
      en: "Placeholder: the video's context, who it was for, what you did and the result go here.",
    },
  },
];

/** Conversion sites (screenshots 1440×900). Summaries are drafts to review. */
export const sites: Site[] = [
  {
    slug: "personal-studio",
    name: "Personal Studio",
    url: "https://personalstudiotest.netlify.app/",
    image: "/work/site-personal-studio.png",
    sector: { pt: "Personal training · Betim, MG", en: "Personal training · Betim, Brazil" },
    summary: {
      pt: "Landing page para personal trainer, com um caminho só até o agendamento da avaliação.",
      en: "Landing page for a personal trainer, with a single path to booking an assessment.",
    },
  },
  {
    slug: "vo2",
    name: "VO2 Centro de Saúde Integrada",
    url: "https://vo2test.netlify.app/",
    image: "/work/site-vo2.png",
    sector: { pt: "Saúde integrada · Resende, RJ", en: "Integrated health · Resende, Brazil" },
    summary: {
      pt: "Site para centro de saúde integrada, do método ao agendamento, com uma narrativa em oito seções.",
      en: "Site for an integrated health centre, from method to booking, told in eight sections.",
    },
  },
];
