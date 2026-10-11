"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { introPending, prefersReducedMotion, whenIntroDone } from "@/lib/motion";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;

    // Freeze the scroll offset when a navigation starts, so the outgoing
    // page snapshot stays where the visitor was looking.
    const markScroll = () => html.style.setProperty("--vt-scroll", `${window.scrollY}px`);
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest?.('a[href^="/"]')) markScroll();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", markScroll);

    let cleanupLenis = () => {};
    if (!prefersReducedMotion()) {
      const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      if (introPending()) lenis.stop();
      const offIntro = whenIntroDone(() => lenis.start());

      cleanupLenis = () => {
        offIntro();
        gsap.ticker.remove(tick);
        lenis.destroy();
        lenisRef.current = null;
      };
    }

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", markScroll);
      cleanupLenis();
    };
  }, []);

  // New route: start at the top. Layout effect so it lands before the view
  // transition captures the incoming page.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());

    // Arriving with a #section: let the page settle (transition / intro),
    // then glide down to it.
    let offIntro = () => {};
    const id = decodeURIComponent(window.location.hash.slice(1));
    const timer = id
      ? window.setTimeout(() => {
          offIntro = whenIntroDone(() => {
            // Hidden, still-mounted routes may share ids; take the visible one.
            const target = Array.from(document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)).find(
              (el) => el.getClientRects().length > 0,
            );
            if (!target) return;
            if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -24, duration: 1.6 });
            else target.scrollIntoView({ behavior: "smooth" });
          });
        }, 900)
      : 0;

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      offIntro();
    };
  }, [pathname]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
