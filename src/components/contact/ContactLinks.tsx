"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, whenIntroDone } from "@/lib/motion";
import { useI18n } from "@/i18n/I18nProvider";

const WHATSAPP = "https://wa.me/5524988223137";
const LINKEDIN = "https://www.linkedin.com/in/pedro-henrique-pinheiro-silva-809787382/";
const EMAIL = "pedropinsil1999@gmail.com";
const CV = {
  pt: { href: "/cv/curriculo-pedro-henrique-pt.pdf", file: "Curriculo - Pedro Henrique Pinheiro Silva.pdf" },
  en: { href: "/cv/resume-pedro-henrique-en.pdf", file: "Resume - Pedro Henrique Pinheiro Silva.pdf" },
};

/**
 * Contact channels as huge words. Each is an outline that fills left-to-right
 * on hover/focus (same gesture as the language chooser), with its detail and
 * a red arrow on the right.
 */
export default function ContactLinks() {
  const root = useRef<HTMLUListElement>(null);
  const { lang, t } = useI18n();

  const links = [
    { label: t.contact.whatsapp, meta: `(24) 98822-3137 · ${t.contact.preferred}`, href: WHATSAPP, external: true },
    { label: t.contact.linkedin, meta: "/in/pedro-henrique-pinheiro-silva", href: LINKEDIN, external: true },
    { label: t.contact.email, meta: EMAIL, href: `mailto:${EMAIL}` },
    { label: t.contact.cv, meta: t.contact.cvMeta, href: CV[lang].href, download: CV[lang].file },
  ];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.set("[data-contact-row]", { yPercent: 110 });
      return whenIntroDone(() =>
        gsap.to("[data-contact-row]", {
          yPercent: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          delay: 0.3,
        }),
      );
    },
    { scope: root },
  );

  return (
    <ul ref={root} className="mb-14 w-full self-end border-t border-branco/10 md:mb-20">
      {links.map((l) => (
        <li key={l.label} className="overflow-hidden border-b border-branco/10">
          <a
            data-contact-row
            href={l.href}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noopener noreferrer" : undefined}
            download={l.download}
            className="contact-link group/link flex flex-col gap-2 py-3 outline-none md:flex-row md:items-baseline md:justify-between md:gap-8 md:py-4"
          >
            <span className="relative font-display text-[clamp(2.25rem,6.2vw,5.25rem)] leading-[1.05]">
              <span className="contact-outline">{l.label}</span>
              <span aria-hidden="true" className="contact-fill absolute inset-0">
                {l.label}
              </span>
            </span>
            <span className="flex items-center gap-3 label text-[0.95rem] text-branco/50 transition-colors group-hover/link:text-branco">
              <span className="md:text-base">{l.meta}</span>
              <span
                aria-hidden="true"
                className="text-base text-vermelho transition-transform duration-500 ease-[var(--ease-cine)] group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
              >
                {l.download ? "↓" : "↗"}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
