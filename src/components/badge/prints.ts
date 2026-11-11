import { LOGO_PATH } from "@/components/ui/Logo";

/** What is printed on the badge, in the page's language. */
export type BadgeCopy = { label: string; role: string; place: string; skills: string[] };

// The print sits inside the acrylic with a clear margin around it.
export const PRINT_W = 800;
export const PRINT_H = 1090;

const PRETO = "#042a41";
const GRAFITE = "#004671";
const BRANCO = "#eaffff";
const VERMELHO = "#7298af";

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

function canvas() {
  const c = document.createElement("canvas");
  c.width = PRINT_W;
  c.height = PRINT_H;
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

/**
 * Draws both sides of the badge print: the ID on the front (photo, name,
 * role) and the PH mark with what he does on the back.
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
  roundRect(f, 0, 0, PRINT_W, PRINT_H, 34);
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

  // Back
  const [back, b] = canvas();
  roundRect(b, 0, 0, PRINT_W, PRINT_H, 34);
  b.fillStyle = GRAFITE;
  b.fill();
  // A soft light from the top, so the navy is not flat.
  const g = b.createRadialGradient(PRINT_W * 0.3, 0, 0, PRINT_W * 0.3, 0, PRINT_H);
  g.addColorStop(0, "rgba(234, 255, 255, 0.12)");
  g.addColorStop(1, "rgba(234, 255, 255, 0)");
  b.fillStyle = g;
  b.fill();
  logo(b, (PRINT_W - 330) / 2, 190, 330, BRANCO);
  b.font = `500 36px ${label}`;
  b.textBaseline = "middle";
  copy.skills.forEach((s, i) => {
    const y = 760 + i * 70;
    b.fillStyle = VERMELHO;
    b.beginPath();
    b.arc(m + 14, y, 9, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = "rgba(234, 255, 255, 0.85)";
    b.fillText(s, m + 44, y);
  });

  return { front, back };
}

/** The lanyard: navy webbing with his name woven along it. */
export function drawStrap() {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  const font = `500 46px ${family("--font-inter")}`;
  const text = "pedro henrique  ·  portfólio  ·  ";
  ctx.font = font;
  // A whole number of repeats, so the texture tiles along the strap without a seam.
  const w = Math.ceil(ctx.measureText(text).width);
  c.width = 128;
  c.height = w * Math.max(1, Math.round(1024 / w));
  ctx.fillStyle = GRAFITE;
  ctx.fillRect(0, 0, c.width, c.height);
  // Woven texture: fine lines along the strap.
  for (let x = 0; x < c.width; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? "rgba(0, 0, 0, 0.12)" : "rgba(234, 255, 255, 0.04)";
    ctx.fillRect(x, 0, 2, c.height);
  }
  // Stitched edges.
  ctx.fillStyle = "rgba(234, 255, 255, 0.18)";
  for (let y = 0; y < c.height; y += 14) {
    ctx.fillRect(10, y, 3, 8);
    ctx.fillRect(c.width - 13, y, 3, 8);
  }
  ctx.save();
  ctx.translate(c.width / 2, 0);
  ctx.rotate(Math.PI / 2);
  ctx.font = font;
  ctx.fillStyle = "rgba(234, 255, 255, 0.6)";
  ctx.textBaseline = "middle";
  for (let y = 0; y < c.height; y += w) ctx.fillText(text, y, 0);
  ctx.restore();
  return { canvas: c, repeat: c.height / c.width };
}
