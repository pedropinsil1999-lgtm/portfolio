import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { gsap } from "@/lib/gsap";
import { drawPrints, drawShadow, drawStrap, drawWear, PRINT_H, PRINT_RADIUS, PRINT_W, type BadgeCopy } from "./prints";

/*
 * World units: the acrylic plate is 1 wide (about 8.6 cm in real life).
 * The stage is a 3 x 3 square: the plate hangs in its lower middle with room
 * on every side to swing, and the two straps run up out of the top edge.
 */
export const STAGE = 3;
const TOP = 4 / 3; // world y of the stage's top edge
const FOV = 20;
const CAM_Y = TOP - STAGE / 2;
const CAM_Z = STAGE / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);

const PLATE_W = 1;
const PLATE_H = 1.42;
const DEPTH = 0.028; // plus the bevel on both faces: 4 mm acrylic
const BEVEL = 0.006;
const SLOT_Y = PLATE_H / 2 - 0.085;
const SLOT_H = 0.026; // half height of the slot

// Hardware, top to bottom: steel crimp on the strap ends, ring, swivel,
// snap hook, plate.
const JOINT = 0.125; // from the strap end down to the swivel
const HOOK_Y = -0.103;
const HOOK_R = 0.042;
const HOOK_STRETCH = 1.5;
const HOOK_TUBE = 0.0095;
// The bridge above the slot rests on the hook's lower bar.
const HANG = -(HOOK_Y - HOOK_R * HOOK_STRETCH + HOOK_TUBE) + SLOT_Y + SLOT_H;

const PLATE_REST_Y = -0.543;
const END_REST_Y = PLATE_REST_Y + HANG + JOINT;
const ANCHOR_Y = TOP + 0.6;
const SPREAD = 0.42; // the straps come down from either side, like off a neck
const ANCHOR_START = { x: 0.2, y: 3.4 };
const DROP = 1.15; // seconds the straps take to come down

// Physics, tuned to the period of a real badge on a long lanyard.
const N = 20; // simulated points per strap
const SUB = 4; // drawn points per simulated segment (a smooth curve through them)
const M = (N - 1) * SUB + 1;
const SEG = Math.hypot(SPREAD, ANCHOR_Y - END_REST_Y) / (N - 1);
const GRAVITY = 40;
const STEP = 1 / 120;
const STRAP_W = 0.12;
const STRAP_T = 0.006; // webbing thickness
// At rest it hangs a little turned, the way a badge does, which shows its thickness.
const REST_YAW = -0.32;

// Drawing-buffer size: sharp on retina, but never more pixels than this.
const MAX_RATIO = 1.75;
const PIXEL_BUDGET = 1.6e6;

export type BadgeScene = {
  canvas: HTMLCanvasElement;
  /** Drops the badge in on its strap. */
  enter(): void;
  /** 0 = front, 1 = turned round to the back. */
  setTurn(progress: number): void;
  /** Stops all work while the hero is off screen. */
  setActive(active: boolean): void;
  /** A still of the badge at rest, as a PNG data URL (for phones). */
  snapshot(size: number): string;
  /** True once it has come to rest and stopped drawing. */
  idle(): boolean;
  /** Runs it ahead by some seconds without waiting for frames (tests). */
  advance(seconds: number): void;
  dispose(): void;
};

/** Where the glint sits on the acrylic; moved as the badge turns. */
const sweep = { value: -0.25 };

/**
 * Acrylic: shows only what it reflects (alpha from the brightness), plus a
 * faint body. Scratches, dust and smudges show where the light catches them.
 */
function acrylic(body: number, tint: Color, face: boolean, wear: Texture) {
  const m = new MeshPhysicalMaterial({
    color: 0x000000,
    roughness: 0.015,
    metalness: 0,
    ior: 1.5,
    specularIntensity: 1,
    clearcoat: 0.6,
    clearcoatRoughness: 0.0,
    envMapIntensity: 1.5,
    transparent: true,
    depthWrite: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBody = { value: body };
    shader.uniforms.uTint = { value: tint };
    shader.uniforms.uSweep = sweep;
    shader.uniforms.uFace = { value: face ? 1 : 0 };
    shader.uniforms.uWear = { value: wear };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying vec3 vLocal;\nvoid main() {")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocal = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform float uBody;\nuniform vec3 uTint;\nuniform float uSweep;\nuniform float uFace;\nuniform sampler2D uWear;\nvarying vec3 vLocal;\nvoid main() {",
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        vec3 refl = gl_FragColor.rgb;
        float lit = clamp(max(max(refl.r, refl.g), refl.b), 0.0, 1.0);
        // A flat sheet mirrors one small patch of the room, so the window
        // light it would catch is drawn on the face: a diagonal band with a
        // clean edge and a thin second line, sliding as the badge turns.
        float d = vLocal.x + vLocal.y * 0.45 - uSweep;
        float band = smoothstep(-0.012, 0.012, d) * (1.0 - smoothstep(0.2, 0.75, d));
        float glint = uFace * (band * 0.11 + exp(-pow((d + 0.11) / 0.022, 2.0)) * 0.07);
        refl += glint;
        vec4 wear = texture2D(uWear, vLocal.xy / vec2(${PLATE_W.toFixed(2)}, ${PLATE_H.toFixed(2)}) + 0.5);
        refl += uFace * (wear.r * (0.012 + lit * 1.1 + glint * 3.2) + wear.g * (0.006 + lit * 0.3 + glint * 0.9));
        float lum = clamp(max(max(refl.r, refl.g), refl.b), 0.0, 1.0);
        float a = clamp(lum + uBody, 0.0, 1.0);
        gl_FragColor = vec4(min((refl + uTint * uBody) / max(a, 1e-4), vec3(1.0)), a);`,
      );
  };
  return m;
}

/**
 * What the shiny parts reflect: a dark studio around the page's navy with a
 * few softboxes, which flash across the acrylic and the steel as they turn.
 */
function studioScene() {
  const s = new Scene();
  s.add(
    new Mesh(
      new SphereGeometry(20, 32, 16),
      new MeshBasicMaterial({ color: new Color(0.03, 0.09, 0.13), side: BackSide }),
    ),
  );
  const softbox = (w: number, h: number, power: number, pos: [number, number, number]) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color().setScalar(power), side: DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  softbox(1.6, 9, 9, [5, 1, 4]); // tall strip, front right: flashes across the face as it turns
  softbox(9, 2, 3.5, [0, 6, 3]); // overhead
  softbox(1.2, 8, 5, [-5.5, 0, 0.5]); // left: lights the edge
  softbox(10, 6, 0.35, [0, -1, 9]); // soft fill from behind the viewer
  return s;
}

function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/** The plate: a rounded rectangle with a slot for the hook, beveled like cut acrylic. */
function plateGeometry() {
  const s = roundedRect(PLATE_W - BEVEL * 2, PLATE_H - BEVEL * 2, 0.07);
  const sw = 0.12, sh = SLOT_H + BEVEL; // half sizes of the slot
  const slot = new Path();
  slot.moveTo(-sw, SLOT_Y - sh);
  slot.absarc(-sw, SLOT_Y, sh, -Math.PI / 2, Math.PI / 2, true);
  slot.lineTo(sw, SLOT_Y + sh);
  slot.absarc(sw, SLOT_Y, sh, Math.PI / 2, -Math.PI / 2, true);
  slot.lineTo(-sw, SLOT_Y - sh);
  s.holes.push(slot);
  const g = new ExtrudeGeometry(s, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 16,
  });
  g.translate(0, 0, -DEPTH / 2);
  return g;
}

/** Catmull-Rom through four points, at t in [0, 1] between b and c. */
function spline(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
}

export async function createBadgeScene(
  host: HTMLElement,
  copy: BadgeCopy,
  { onLost }: { onLost: () => void },
): Promise<BadgeScene> {
  const { front, back } = await drawPrints(copy);
  const strap = drawStrap();

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const studio = studioScene();
  const env = pmrem.fromScene(studio, 0.02).texture;
  studio.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as Material).dispose();
    }
  });
  pmrem.dispose();
  scene.environment = env;
  const key = new DirectionalLight(0xffffff, 3.4);
  key.position.set(-2, 2.5, 3);
  scene.add(key);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, CAM_Y, CAM_Z);
  camera.lookAt(0, CAM_Y, 0);

  const textures: Texture[] = [];
  const texture = (c: HTMLCanvasElement, color = true) => {
    const t = new CanvasTexture(c);
    if (color) t.colorSpace = SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(t);
    return t;
  };

  // The shadow on the wall behind, drawn first.
  const shadow = new Mesh(
    new PlaneGeometry((256 / 140) * PLATE_W, (320 / 199) * PLATE_H),
    new MeshBasicMaterial({ map: texture(drawShadow()), color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  shadow.renderOrder = -1;
  scene.add(shadow);

  const steel = new MeshStandardMaterial({ color: 0xe3ebef, metalness: 1, roughness: 0.18, envMapIntensity: 1.6 });

  // The strap ends are clamped in a steel crimp with a ring below it; the
  // crimp follows the straps, the swivel under the ring lets the plate turn.
  const crimpGroup = new Group();
  crimpGroup.rotation.order = "ZXY";
  scene.add(crimpGroup);
  const crimp = new Mesh(new RoundedBoxGeometry(STRAP_W * 1.3, 0.07, 0.032, 3, 0.012), steel);
  crimp.position.y = -0.012;
  crimpGroup.add(crimp);
  // Two pressed ribs across the crimp.
  for (const y of [0.004, -0.028]) {
    const rib = new Mesh(new CylinderGeometry(0.004, 0.004, STRAP_W * 1.24, 8), steel);
    rib.rotation.z = Math.PI / 2;
    rib.position.set(0, y, 0.016);
    crimpGroup.add(rib);
  }
  // Hooked into the crimp above and the swivel below.
  const ring = new Mesh(new TorusGeometry(0.0325, 0.0065, 12, 36), steel);
  ring.position.y = -0.085;
  crimpGroup.add(ring);

  const card = new Group();
  card.rotation.order = "ZXY";
  scene.add(card);
  const swivel = new Mesh(new CylinderGeometry(0.017, 0.02, 0.04, 20), steel);
  swivel.position.y = -0.02;
  card.add(swivel);
  const collar = new Mesh(new CylinderGeometry(0.023, 0.023, 0.008, 20), steel);
  collar.position.y = -0.006;
  card.add(collar);
  const hookGeo = new TorusGeometry(HOOK_R, HOOK_TUBE, 14, 48);
  hookGeo.scale(1, HOOK_STRETCH, 1);
  const hook = new Mesh(hookGeo, steel);
  hook.rotation.y = Math.PI / 2;
  hook.position.y = HOOK_Y;
  card.add(hook);
  // The gate of the snap hook: a short sleeve on its front run.
  const gate = new Mesh(new CylinderGeometry(HOOK_TUBE * 1.35, HOOK_TUBE * 1.35, 0.05, 12), steel);
  gate.position.set(0, HOOK_Y + 0.012, HOOK_R);
  card.add(gate);

  const plate = new Group();
  plate.position.y = -HANG;
  card.add(plate);

  // The printed card: PVC with a white edge, sealed inside the acrylic.
  const printW = PLATE_W - 0.12;
  const printH = (printW * PRINT_H) / PRINT_W;
  const printY = SLOT_Y - 0.075 - printH / 2;
  const coreGeo = new ExtrudeGeometry(roundedRect(printW, printH, (PRINT_RADIUS / PRINT_W) * printW), {
    depth: 0.009,
    bevelEnabled: false,
    curveSegments: 10,
  });
  coreGeo.translate(0, 0, -0.0045);
  const core = new Mesh(coreGeo, new MeshStandardMaterial({ color: 0xf2fafa, roughness: 0.5 }));
  core.position.y = printY;
  plate.add(core);
  const print = (map: Texture, z: number, flip: boolean) => {
    const m = new MeshStandardMaterial({ map, roughness: 0.4, envMapIntensity: 0.9, alphaTest: 0.5 });
    const mesh = new Mesh(new PlaneGeometry(printW, printH), m);
    mesh.position.set(0, printY, z);
    if (flip) mesh.rotation.y = Math.PI;
    plate.add(mesh);
  };
  print(texture(front), 0.0052, false);
  print(texture(back), -0.0052, true);

  const wear = texture(drawWear(), false);
  const glass = new Mesh(plateGeometry(), [
    acrylic(0.03, new Color(0.85, 0.95, 1), true, wear),
    acrylic(0.4, new Color(0.7, 0.9, 1), false, wear),
  ]);
  glass.renderOrder = 2;
  plate.add(glass);

  // --- The straps: flat webbing with a real thickness ----------------------
  // Each drawn cross-section is a thin rectangle: front, right edge, back,
  // left edge (8 vertices, so the edges stay crisp).
  const strapTex = texture(strap.color);
  const strapBump = texture(strap.bump, false);
  strapTex.wrapS = strapTex.wrapT = strapBump.wrapS = strapBump.wrapT = RepeatWrapping;
  // Satin polyester: a soft sheen running along the strap, not a flat print.
  const strapMaterial = new MeshStandardMaterial({
    map: strapTex,
    bumpMap: strapBump,
    bumpScale: 1.4,
    roughness: 0.58,
    envMapIntensity: 0.85,
    side: DoubleSide,
  });
  const length = SEG * (N - 1);
  const vAt = (i: number) => ((M - 1 - i) / (M - 1)) * (length / (STRAP_W * strap.repeat));
  const strands = [0, 1].map(() => {
    const geo = new BufferGeometry();
    const verts = new Float32Array(M * 8 * 3);
    const uvs = new Float32Array(M * 8 * 2);
    const idx: number[] = [];
    for (let i = 0; i < M; i++) {
      const v = vAt(i);
      // front 0..1, right edge, back 0..1 (mirrored), left edge
      uvs.set([0, v, 1, v, 0.97, v, 0.99, v, 1, v, 0, v, 0.01, v, 0.03, v], i * 16);
      if (i < M - 1) {
        for (let f = 0; f < 4; f++) {
          const a = i * 8 + f * 2;
          idx.push(a, a + 8, a + 1, a + 1, a + 8, a + 9);
        }
      }
    }
    geo.setAttribute("position", new BufferAttribute(verts, 3));
    geo.setAttribute("uv", new BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    const mesh = new Mesh(geo, strapMaterial);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { geo, verts };
  });

  // --- Physics -------------------------------------------------------------
  // Particles: each strap from its anchor down, sharing the last one (the end).
  const END = 2 * (N - 1);
  const index = (strand: number, i: number) => (i === N - 1 ? END : strand * (N - 1) + i);
  const anchor = { x: ANCHOR_START.x, y: ANCHOR_START.y }; // offset of both anchors, eased to 0
  const anchorX = (strand: number) => (strand ? SPREAD : -SPREAD) + anchor.x;
  const p = Array.from({ length: END + 1 }, () => new Vector3());
  const prev = p.map(() => new Vector3());
  const inv = p.map(() => 1);
  inv[index(0, 0)] = inv[index(1, 0)] = 0;
  inv[END] = 0.25; // the badge weighs far more than the webbing
  const hang = () => {
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        p[index(s, i)].set(anchorX(s) * (1 - t) + anchor.x * t, ANCHOR_Y + anchor.y + (END_REST_Y - ANCHOR_Y) * t, 0);
      }
    }
    for (let i = 0; i <= END; i++) prev[i].copy(p[i]);
  };
  hang();
  const endVel = new Vector3();
  const lastEndVel = new Vector3();
  // Swing of the plate about the swivel (roll, pitch), and its turn (yaw).
  let roll = 0, rollV = 0, pitch = 0, pitchV = 0, yaw = REST_YAW, yawV = 0, turn = 0;
  // The drop runs on the simulation's own clock, so a slow frame can never
  // jerk the straps: -1 until it enters.
  let dropT = -1;
  const easeX = gsap.parseEase("power2.out");
  // Arrives with a little give, like webbing taking the weight.
  const easeY = gsap.parseEase("back.out(1.25)");

  const tmp = new Vector3();
  /** Pulls (or, with `push`, pushes) two particles toward a distance. */
  const constrain = (ia: number, ib: number, rest: number, push: boolean, stiffness: number) => {
    const w = inv[ia] + inv[ib];
    if (!w) return;
    const d = tmp.subVectors(p[ib], p[ia]);
    const len = d.length() || 1e-6;
    if (push ? len >= rest : len <= rest) return;
    d.multiplyScalar(((len - rest) / len / w) * stiffness);
    p[ia].addScaledVector(d, inv[ia]);
    p[ib].addScaledVector(d, -inv[ib]);
  };
  const stepPhysics = (dt: number) => {
    if (dropT >= 0 && dropT < DROP) {
      dropT = Math.min(DROP, dropT + dt);
      anchor.x = ANCHOR_START.x * (1 - easeX(dropT / DROP));
      anchor.y = ANCHOR_START.y * (1 - easeY(dropT / DROP));
    }
    for (let s = 0; s < 2; s++) p[index(s, 0)].set(anchorX(s), ANCHOR_Y + anchor.y, 0);
    for (let i = 0; i <= END; i++) {
      if (!inv[i]) continue;
      // Webbing is light and loses its own motion quickly; the badge keeps swinging.
      const v = tmp.subVectors(p[i], prev[i]).multiplyScalar(i === END ? 0.994 : 0.982);
      prev[i].copy(p[i]);
      p[i].add(v);
      p[i].y -= GRAVITY * dt * dt;
    }
    for (let k = 0; k < 10; k++) {
      for (let s = 0; s < 2; s++) {
        // Webbing does not push back along its length: it only pulls when
        // stretched, so a strap that loses its load goes slack and bows.
        for (let i = 0; i < N - 1; i++) constrain(index(s, i), index(s, i + 1), SEG, false, 1);
        // But it resists folding sharply: bows are soft curves, never kinks.
        for (let i = 0; i < N - 2; i++) constrain(index(s, i), index(s, i + 2), SEG * 1.75, true, 0.35);
      }
    }
    // The plate is a pendulum hanging from the swivel, pushed by how the end
    // of the straps accelerates. Bounded, so a snap tilts it but never flips it.
    endVel.subVectors(p[END], prev[END]).divideScalar(dt);
    const bound = (a: number) => Math.max(-90, Math.min(90, a));
    const ax = bound((endVel.x - lastEndVel.x) / dt);
    const ay = bound((endVel.y - lastEndVel.y) / dt);
    const az = bound((endVel.z - lastEndVel.z) / dt);
    lastEndVel.copy(endVel);
    const g = Math.max(GRAVITY * 0.4, GRAVITY + ay);
    rollV += (-(g / HANG) * Math.sin(roll) - (ax / HANG) * Math.cos(roll) - 2 * rollV) * dt;
    pitchV += (-(g / HANG) * Math.sin(pitch) + (az / HANG) * Math.cos(pitch) - 2 * pitchV) * dt;
    roll += rollV * dt;
    pitch += pitchV * dt;
    // The hook only lets it swing so far.
    if (Math.abs(roll) > 1.1) {
      roll = Math.sign(roll) * 1.1;
      rollV *= -0.3;
    }
    // The turn: it springs round on the swivel with a little overshoot.
    const target = REST_YAW + turn * Math.PI;
    yawV += (32 * (target - yaw) - 7 * yawV) * dt;
    yaw += yawV * dt;
  };

  // --- Meshes from the simulation -------------------------------------------
  const pts = Array.from({ length: N + 2 }, () => new Vector3());
  const curve = Array.from({ length: M }, () => new Vector3());
  const side = new Vector3();
  const tangent = new Vector3();
  const normal = new Vector3();
  const dir = new Vector3();
  const centre = new Vector3();
  const update = () => {
    const end = p[END];

    // The crimp lines up with the straps above it.
    dir.copy(end).multiplyScalar(2).sub(p[index(0, N - 3)]).sub(p[index(1, N - 3)]).normalize();
    crimpGroup.position.copy(end);
    crimpGroup.rotation.set(
      Math.atan2(-dir.z, -dir.y) * 0.6 + pitch * 0.3,
      0,
      Math.atan2(dir.x, -dir.y) * 0.6 + roll * 0.3,
    );
    crimpGroup.updateMatrixWorld();
    card.position.set(0, -JOINT, 0).applyMatrix4(crimpGroup.matrixWorld);
    card.rotation.set(pitch, yaw, roll);
    card.updateMatrixWorld();
    sweep.value = -0.25 + (yaw - REST_YAW) * 0.55 + roll * 0.5 + pitch * 0.5;

    // The shadow falls down and to the right of the plate, thinner as it turns.
    centre.set(0, -HANG, 0).applyMatrix4(card.matrixWorld);
    shadow.position.set(centre.x + 0.15, centre.y - 0.17, -0.7);
    shadow.rotation.z = roll;
    shadow.scale.x = Math.max(Math.abs(Math.cos(yaw)), 0.1);

    for (let s = 0; s < 2; s++) {
      // A smooth curve through the simulated points (ends extended straight).
      for (let i = 0; i < N; i++) pts[i + 1].copy(p[index(s, i)]);
      pts[0].copy(pts[1]).multiplyScalar(2).sub(pts[2]);
      pts[N + 1].copy(pts[N]).multiplyScalar(2).sub(pts[N - 1]);
      for (let j = 0; j < M; j++) {
        const seg = Math.min(N - 2, Math.floor(j / SUB));
        const t = (j - seg * SUB) / SUB;
        const [a, b, c, d] = [pts[seg], pts[seg + 1], pts[seg + 2], pts[seg + 3]];
        curve[j].set(spline(a.x, b.x, c.x, d.x, t), spline(a.y, b.y, c.y, d.y, t), spline(a.z, b.z, c.z, d.z, t));
      }
      const { geo, verts } = strands[s];
      // The side direction is carried down the strap from the top (flat to
      // the viewer), so it never flips where the strap bends.
      side.set(1, 0, 0);
      for (let j = 0; j < M; j++) {
        tangent.subVectors(curve[Math.min(M - 1, j + 1)], curve[Math.max(0, j - 1)]).normalize();
        side.addScaledVector(tangent, -side.dot(tangent)).normalize();
        normal.crossVectors(tangent, side);
        // The two straps lie one over the other where they meet the crimp.
        const u = j / (M - 1);
        const lift = (s ? -1 : 1) * 0.004 * u * u;
        const cx = curve[j].x + normal.x * lift, cy = curve[j].y + normal.y * lift, cz = curve[j].z + normal.z * lift;
        const w = STRAP_W / 2, h = STRAP_T / 2;
        const o = j * 24;
        const put = (k: number, sw: number, sh: number) => {
          verts[o + k * 3] = cx + side.x * sw + normal.x * sh;
          verts[o + k * 3 + 1] = cy + side.y * sw + normal.y * sh;
          verts[o + k * 3 + 2] = cz + side.z * sw + normal.z * sh;
        };
        put(0, -w, h); put(1, w, h); // front
        put(2, w, h); put(3, w, -h); // right edge
        put(4, w, -h); put(5, -w, -h); // back
        put(6, -w, -h); put(7, -w, h); // left edge
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    }
  };

  // --- Loop: runs only while something moves ------------------------------
  let active = true;
  let running = false;
  let acc = 0;
  let calm = 0;
  let lost = false;
  let disposed = false;
  const energy = () => {
    let e = Math.abs(rollV) + Math.abs(pitchV) + Math.abs(yawV) + Math.abs(REST_YAW + turn * Math.PI - yaw);
    for (let i = 0; i <= END; i++) if (inv[i]) e += p[i].distanceToSquared(prev[i]) * 1e4;
    return e;
  };
  const draw = () => {
    update();
    renderer.render(scene, camera);
  };
  const tick = (_t: number, deltaMs: number) => {
    acc += Math.min(deltaMs / 1000, 1 / 20);
    while (acc >= STEP) {
      stepPhysics(STEP);
      acc -= STEP;
    }
    draw();
    calm = energy() < 0.01 ? calm + 1 : 0;
    if (dropT >= DROP && calm > 30) halt();
  };
  const start = () => {
    if (running || !active || lost || dropT < 0) return;
    running = true;
    calm = 0;
    acc = 0;
    gsap.ticker.add(tick);
  };
  const halt = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  };

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_RATIO, Math.sqrt(PIXEL_BUDGET / (w * h))));
    renderer.setSize(w, h, false);
    if (!running) draw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    halt();
    // Our own dispose() drops the context on purpose: not a loss to report.
    if (!disposed) onLost();
  });

  update();
  host.appendChild(canvas);
  resize();
  // Compile off the main thread where the browser can.
  await renderer.compileAsync(scene, camera);
  draw();

  return {
    canvas,
    enter() {
      if (dropT < 0) dropT = 0;
      start();
    },
    setTurn(progress) {
      turn = progress;
      start();
    },
    setActive(on) {
      active = on;
      if (on) start();
      else halt();
    },
    snapshot(size) {
      const was = turn;
      dropT = DROP;
      anchor.x = anchor.y = 0;
      turn = 0;
      hang();
      endVel.set(0, 0, 0);
      lastEndVel.set(0, 0, 0);
      roll = rollV = pitch = pitchV = yawV = 0;
      yaw = REST_YAW;
      // Let the straps settle into how they really hang.
      for (let i = 0; i < 600; i++) stepPhysics(STEP);
      for (let i = 0; i <= END; i++) prev[i].copy(p[i]);
      renderer.setPixelRatio(1);
      renderer.setSize(size, size, false);
      draw();
      const url = canvas.toDataURL("image/png");
      turn = was;
      resize();
      return url;
    },
    idle: () => !running,
    advance(seconds) {
      for (let i = 0; i < seconds * 60; i++) tick(0, 1000 / 60);
    },
    dispose() {
      disposed = true;
      halt();
      ro.disconnect();
      scene.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: Material) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
