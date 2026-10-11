/**
 * Tileable film grain (SVG noise) as a data URL. Laid over soft gradients at
 * very low opacity it dithers away 8-bit banding; cheap because it is static.
 */
export const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>',
  );
