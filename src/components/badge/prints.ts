import { LOGO_PATH } from "@/components/ui/Logo";

/** What is printed on the badge, in the page's language. */
export type BadgeCopy = { label: string; role: string; place: string; skills: string[] };

// The printed card sits inside the acrylic with a clear margin around it.
export const PRINT_W = 800;
export const PRINT_H = 1090;
export const PRINT_RADIUS = 34;

const PRETO = "#042a41";
const GRAFITE = "#004671";
const BRANCO = "#eaffff";
const VERMELHO = "#7298af";

/** Repeatable randomness, so the wear and grain are the same on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** The family behind one of the next/font CSS variables. */
function family(variable: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || "sans-serif";
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvas(w = PRINT_W, h = PRINT_H) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function logo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(LOGO_PATH));
  ctx.restore();
}

/** Ink on a card is never perfectly even: a fine grain over the whole print. */
function grain(ctx: CanvasRenderingContext2D, seed: number) {
  const img = ctx.getImageData(0, 0, PRINT_W, PRINT_H);
  const d = img.data;
  const rnd = seeded(seed);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const n = (rnd() - 0.5) * 11;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Draws both sides of the printed card: the ID on the front (photo, name,
 * role) and the PH mark with what he does on the back. Both sides are light,
 * so the card stands out from the navy page whichever way it faces.
 */
export async function drawPrints(copy: BadgeCopy) {
  const display = family("--font-dela-gothic");
  const script = family("--font-great-vibes");
  const label = family("--font-inter");
  const [photo] = await Promise.all([
    loadImage("/hero/pedro-natural.webp"),
    document.fonts.load(`100px ${display}`, "Pedro"),
    document.fonts.load(`100px ${script}`, "Henrique"),
    document.fonts.load(`30px ${label}`, copy.role),
  ]);

  // Front
  const [front, f] = canvas();
  roundRect(f, 0, 0, PRINT_W, PRINT_H, PRINT_RADIUS);
  f.fillStyle = BRANCO;
  f.fill();

  const m = 52;
  logo(f, m, 44, 46, PRETO);
  f.font = `500 28px ${label}`;
  f.fillStyle = "rgba(4, 42, 65, 0.72)";
  f.textAlign = "right";
  f.textBaseline = "middle";
  f.fillText(copy.label, PRINT_W - m, 67);

  // Photo, cropped like the site's portrait (focus near the face).
  const px = m, py = 118, pw = PRINT_W - m * 2, ph = 560;
  f.save();
  roundRect(f, px, py, pw, ph, 30);
  f.clip();
  const scale = Math.max(pw / photo.width, ph / photo.height);
  const dw = photo.width * scale, dh = photo.height * scale;
  f.drawImage(photo, px + (pw - dw) * 0.5, py + (ph - dh) * 0.18, dw, dh);
  const v = f.createRadialGradient(px + pw * 0.45, py + ph * 0.35, pw * 0.25, px + pw * 0.45, py + ph * 0.35, pw * 0.8);
  v.addColorStop(0, "rgba(4, 42, 65, 0)");
  v.addColorStop(1, "rgba(4, 42, 65, 0.5)");
  f.fillStyle = v;
  f.fillRect(px, py, pw, ph);
  f.restore();

  f.textAlign = "left";
  f.textBaseline = "alphabetic";
  f.fillStyle = PRETO;
  f.font = `400 92px ${display}`;
  f.fillText("Pedro", m - 2, 790);
  f.fillStyle = "rgba(4, 42, 65, 0.85)";
  f.font = `400 104px ${script}`;
  f.fillText("Henrique", m + 30, 872);

  f.fillStyle = "rgba(4, 42, 65, 0.8)";
  f.font = `500 26px ${label}`;
  f.fillText(copy.role, m, 990);
  f.fillText(copy.place, m, 1028);

  // Code stripes, like a pass.
  f.fillStyle = "rgba(4, 42, 65, 0.75)";
  const bars = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 2];
  let bx = PRINT_W - m - 190;
  bars.forEach((w, i) => {
    if (i % 2 === 0) f.fillRect(bx, 966, w * 3, 62);
    bx += w * 3 + 2;
  });
  grain(f, 7);

  // Back
  const [back, b] = canvas();
  roundRect(b, 0, 0, PRINT_W, PRINT_H, PRINT_RADIUS);
  b.fillStyle = BRANCO;
  b.fill();
  logo(b, (PRINT_W - 320) / 2, 200, 320, GRAFITE);
  // A hairline, then what he does.
  b.fillStyle = "rgba(4, 42, 65, 0.18)";
  b.fillRect(m, 690, PRINT_W - m * 2, 2);
  b.font = `500 36px ${label}`;
  b.textBaseline = "middle";
  copy.skills.forEach((s, i) => {
    const y = 770 + i * 70;
    b.fillStyle = VERMELHO;
    b.beginPath();
    b.arc(m + 14, y, 9, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = "rgba(4, 42, 65, 0.88)";
    b.fillText(s, m + 44, y);
  });
  b.font = `500 26px ${label}`;
  b.fillStyle = "rgba(4, 42, 65, 0.55)";
  b.textAlign = "right";
  b.fillText(copy.label, PRINT_W - m, 1010);
  grain(b, 11);

  return { front, back };
}

/** Webbing: a twill weave. `height` is drawn as brightness for the bump map. */
function weave(ctx: CanvasRenderingContext2D, w: number, h: number, height: boolean) {
  ctx.fillStyle = height ? "#808080" : GRAFITE;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 3) {
    const shift = ((y / 3) % 4) * 2;
    for (let x = -8; x < w; x += 8) {
      ctx.fillStyle = height ? "rgba(255, 255, 255, 0.55)" : "rgba(234, 255, 255, 0.07)";
      ctx.fillRect(x + shift, y, 4, 2);
      ctx.fillStyle = height ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.16)";
      ctx.fillRect(x + shift + 4, y + 2, 4, 1);
    }
  }
  // Thicker woven selvedge on both edges.
  ctx.fillStyle = height ? "rgba(255, 255, 255, 0.5)" : "rgba(234, 255, 255, 0.07)";
  ctx.fillRect(0, 0, 9, h);
  ctx.fillRect(w - 9, 0, 9, h);
  ctx.fillStyle = height ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.22)";
  ctx.fillRect(9, 0, 2, h);
  ctx.fillRect(w - 11, 0, 2, h);
}

/** The lanyard: navy webbing with his name printed along it, plus its relief. */
export function drawStrap() {
  const font = `600 44px ${family("--font-inter")}`;
  const text = "pedro henrique  ·  portfólio  ·  ";
  const [color, c] = canvas(128, 16);
  c.font = font;
  // A whole number of repeats (and of weave rows), so it tiles without a seam.
  const w = Math.ceil(c.measureText(text).width / 12) * 12;
  const h = w * Math.max(1, Math.round(1024 / w));
  color.height = h;
  const [bump, bc] = canvas(128, h);
  weave(c, 128, h, false);
  weave(bc, 128, h, true);
  for (const [ctx, fill] of [
    [c, "rgba(234, 255, 255, 0.72)"],
    // The print fills the weave a little: slightly raised and smoother.
    [bc, "rgba(170, 170, 170, 0.55)"],
  ] as const) {
    ctx.save();
    ctx.translate(64, 0);
    ctx.rotate(Math.PI / 2);
    ctx.font = font;
    ctx.fillStyle = fill;
    ctx.textBaseline = "middle";
    for (let y = 0; y < h; y += w) ctx.fillText(text, y, 0, w);
    ctx.restore();
  }
  return { color, bump, repeat: h / 128 };
}

/** The sewn tab where the two straps meet: a box stitch with a cross. */
export function drawTab() {
  const [color, c] = canvas(128, 128);
  const [bump, bc] = canvas(128, 128);
  weave(c, 128, 128, false);
  weave(bc, 128, 128, true);
  for (const [ctx, stroke] of [
    [c, "rgba(234, 255, 255, 0.55)"],
    [bc, "rgba(255, 255, 255, 0.9)"],
  ] as const) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 4]);
    ctx.strokeRect(22, 22, 84, 84);
    ctx.beginPath();
    ctx.moveTo(22, 22);
    ctx.lineTo(106, 106);
    ctx.moveTo(106, 22);
    ctx.lineTo(22, 106);
    ctx.stroke();
  }
  return { color, bump };
}

/**
 * Wear on the acrylic, seen only where light catches it.
 * Red: hairline scratches and dust. Green: soft smudges from handling.
 */
export function drawWear() {
  const [wear, ctx] = canvas(1024, 1454);
  const rnd = seeded(23);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, wear.width, wear.height);
  ctx.globalCompositeOperation = "lighter";
  // Smudges
  for (let i = 0; i < 7; i++) {
    const x = rnd() * wear.width, y = rnd() * wear.height, r = 90 + rnd() * 190;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0, ${Math.round(70 + rnd() * 90)}, 0, 1)`);
    g.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.scale(1, 0.45 + rnd() * 0.4);
    ctx.translate(-x, -y);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  // Scratches: mostly along one direction, as from sliding in and out of a pocket.
  ctx.lineCap = "round";
  for (let i = 0; i < 190; i++) {
    const x = rnd() * wear.width, y = rnd() * wear.height;
    const a = (rnd() < 0.7 ? 0.5 : rnd() * Math.PI) + (rnd() - 0.5) * 0.5;
    const len = 18 + rnd() * rnd() * 260;
    ctx.strokeStyle = `rgba(${Math.round(60 + rnd() * 195)}, 0, 0, 1)`;
    ctx.lineWidth = 0.6 + rnd() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a) * len * 0.5 + (rnd() - 0.5) * 12,
      y + Math.sin(a) * len * 0.5 + (rnd() - 0.5) * 12,
      x + Math.cos(a) * len,
      y + Math.sin(a) * len,
    );
    ctx.stroke();
  }
  // Dust
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(${Math.round(90 + rnd() * 165)}, 0, 0, 1)`;
    ctx.beginPath();
    ctx.arc(rnd() * wear.width, rnd() * wear.height, 0.6 + rnd() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  return wear;
}

/**
 * The soft shadow the badge throws on the wall behind it: the acrylic
 * lets most light through, the printed card does not.
 */
export function drawShadow() {
  const [shadow, ctx] = canvas(256, 320);
  // Drawn off-canvas, so only the blurred shadow of each shape lands on it.
  const cast = (x: number, y: number, w: number, h: number, r: number, alpha: number, blur: number) => {
    ctx.shadowColor = `rgba(0, 0, 0, ${alpha})`;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 1000;
    ctx.fillStyle = "#000";
    roundRect(ctx, x - 1000, y, w, h, r);
    ctx.fill();
  };
  cast(58, 62, 140, 199, 12, 0.3, 22); // the plate, faint
  cast(66, 84, 124, 169, 8, 0.75, 16); // the card, denser
  return shadow;
}
