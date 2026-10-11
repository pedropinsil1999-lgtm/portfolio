"use client";

/**
 * Inline script that runs during HTML parsing (before first paint) without
 * React's dev warning about rendering <script> tags on the client.
 * Must be a Client Component: the `typeof window` check has to run in the
 * browser too, so client renders (e.g. switching language) emit text/plain.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
