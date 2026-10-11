"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ContextSafe = <T extends (...args: never[]) => unknown>(fn: T) => T;
type Setup = (context: gsap.Context, contextSafe: ContextSafe) => void | (() => void);
type Config = {
  scope?: RefObject<Element | null>;
  /** Re-run the setup when these change (added to the same context, as @gsap/react does). */
  dependencies?: unknown[];
};

const useIsoLayoutEffect = typeof document !== "undefined" ? useLayoutEffect : useEffect;
const NONE: unknown[] = [];

/** Stops everything a context drives right away, without touching the DOM. */
function freeze(ctx: gsap.Context) {
  for (const item of ctx.data as unknown[]) {
    if (item instanceof ScrollTrigger) item.disable(false);
    else if (item instanceof gsap.core.Animation) item.pause();
    else if (item && typeof (item as gsap.Context).revert === "function") freeze(item as gsap.Context);
  }
}

const whenIdle = (fn: () => void) =>
  typeof window.requestIdleCallback === "function"
    ? window.requestIdleCallback(fn, { timeout: 1000 })
    : window.setTimeout(fn, 300);

/**
 * `useGSAP` from @gsap/react, with one change in when the clean-up happens.
 * Reverting a page's animations (restoring every inline style, killing its
 * scroll triggers) took up to ~16 ms per component on a fast computer, and it
 * ran right inside the click that changes page, delaying the transition. Here
 * an unmounting component's animations are frozen at once (cheap) and
 * reverted when the browser is idle, i.e. while the page transition plays.
 * If the same component sets up again before that (a hidden route shown
 * again, React's dev double mount), the pending revert is done first.
 */
export function useGSAP(setup: Setup, { scope, dependencies = NONE }: Config = {}) {
  const ctx = useRef<gsap.Context | null>(null);
  const pending = useRef<{ ctx: gsap.Context; id: number } | null>(null);

  const flush = () => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(p.id);
    window.clearTimeout(p.id);
    p.ctx.revert();
  };

  const retire = () => {
    const c = ctx.current;
    if (!c) return;
    ctx.current = null;
    flush();
    freeze(c);
    const entry = { ctx: c, id: 0 };
    entry.id = whenIdle(() => {
      if (pending.current === entry) pending.current = null;
      c.revert();
    });
    pending.current = entry;
  };

  // Lives for the whole mount: dependency changes add to the same context.
  useIsoLayoutEffect(() => {
    return retire;
  }, NONE);

  useIsoLayoutEffect(() => {
    flush();
    ctx.current ??= gsap.context(() => {}, scope?.current ?? undefined);
    ctx.current.add(setup as (...args: unknown[]) => unknown, scope?.current ?? undefined);
  }, dependencies);
}

export { gsap, ScrollTrigger };
