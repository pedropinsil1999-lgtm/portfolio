"use client";

import { useLenis } from "@/components/SmoothScroll";
import { useI18n } from "@/i18n/I18nProvider";

export default function BackToTop() {
  const lenis = useLenis();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={() =>
        lenis?.current
          ? lenis.current.scrollTo(0, { duration: 1.4 })
          : window.scrollTo({ top: 0, behavior: "smooth" })
      }
      className="label text-[0.95rem] transition-colors hover:text-fg"
    >
      {t.footer.backToTop}
    </button>
  );
}
