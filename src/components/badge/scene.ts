import {
  AddEquation,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CustomBlending,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  NoBlending,
  OneFactor,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  UnsignedByteType,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  type Material,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { gsap } from "@/lib/gsap";
import {
  drawPrints,
  drawShadow,
  drawStrap,
  drawTab,
  drawWear,
  PRINT_H,
  PRINT_RADIUS,
  PRINT_W,
  type BadgeCopy,
} from "./prints";

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

// Hardware, top to bottom: sewn tab, eye ring, swivel, snap hook, plate.
const TAB = 0.14;
const JOINT = 0.182; // from the strap end down to the swivel
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
const N = 20; // points per strap
const SEG = Math.hypot(SPREAD, ANCHOR_Y - END_REST_Y) / (N - 1);
const GRAVITY = 40;
const STEP = 1 / 120;
const STRAP_W = 0.13;
// At rest it hangs a little turned, the way a badge does, which shows its thickness.
const REST_YAW = -0.32;

// Motion blur: how long the "shutter" stays open, in seconds (0.6 of a 60 Hz frame).
const SHUTTER = 0.6 / 60;
const MAX_SAMPLES = 5;
const MAX_BLUR = 11; // pixels
const PIXEL_BUDGET = 1.9e6;

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

const QUAD_VERTEX = "varying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}";

export async function createBadgeScene(
  host: HTMLElement,
  copy: BadgeCopy,
  { onLost }: { onLost: () => void },
): Promise<BadgeScene> {
  const { front, back } = await drawPrints(copy);
  const strap = drawStrap();
  const tab = drawTab();

  const renderer = new WebGLRenderer({ antialias: false, alpha: true });
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

  // The sewn tab and its eye ring follow the straps; the swivel below it
  // lets the hook and the plate turn freely.
  const steel = new MeshStandardMaterial({ color: 0xe3ebef, metalness: 1, roughness: 0.18, envMapIntensity: 1.6 });
  const fabric = (map: Texture, bumpMap: Texture) =>
    new MeshPhysicalMaterial({
      map,
      bumpMap,
      bumpScale: 2.2,
      roughness: 0.95,
      sheen: 1,
      sheenRoughness: 0.55,
      sheenColor: new Color(0.35, 0.55, 0.75),
      envMapIntensity: 0.7,
      side: DoubleSide,
    });

  const tabGroup = new Group();
  tabGroup.rotation.order = "ZXY";
  scene.add(tabGroup);
  const tabMesh = new Mesh(
    new RoundedBoxGeometry(STRAP_W + 0.012, TAB, 0.02, 3, 0.007),
    fabric(texture(tab.color), texture(tab.bump, false)),
  );
  tabMesh.position.y = -TAB / 2;
  tabGroup.add(tabMesh);
  const eye = new Mesh(new TorusGeometry(0.032, 0.007, 12, 40), steel);
  eye.position.y = -0.15;
  tabGroup.add(eye);

  const card = new Group();
  card.rotation.order = "ZXY";
  scene.add(card);
  const swivel = new Mesh(new CylinderGeometry(0.017, 0.02, 0.04, 24), steel);
  swivel.position.y = -0.02;
  card.add(swivel);
  const collar = new Mesh(new CylinderGeometry(0.023, 0.023, 0.008, 24), steel);
  collar.position.y = -0.006;
  card.add(collar);
  const hookGeo = new TorusGeometry(HOOK_R, HOOK_TUBE, 16, 56);
  hookGeo.scale(1, HOOK_STRETCH, 1);
  const hook = new Mesh(hookGeo, steel);
  hook.rotation.y = Math.PI / 2;
  hook.position.y = HOOK_Y;
  card.add(hook);
  // The gate of the snap hook: a short sleeve on its front run.
  const gate = new Mesh(new CylinderGeometry(HOOK_TUBE * 1.35, HOOK_TUBE * 1.35, 0.05, 16), steel);
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

  // The straps: two ribbons, each along its own simulated rope.
  const strapTex = texture(strap.color);
  const strapBump = texture(strap.bump, false);
  strapTex.wrapS = strapTex.wrapT = strapBump.wrapS = strapBump.wrapT = RepeatWrapping;
  const strapMaterial = fabric(strapTex, strapBump);
  const strands = [0, 1].map(() => {
    const geo = new BufferGeometry();
    // Three vertices across, the middle one set back: webbing is slightly cupped.
    const verts = new Float32Array(N * 3 * 3);
    const uvs = new Float32Array(N * 3 * 2);
    const idx: number[] = [];
    for (let i = 0; i < N; i++) {
      const v = ((N - 1 - i) * SEG) / (STRAP_W * strap.repeat);
      uvs.set([0, v, 0.5, v, 1, v], i * 6);
      if (i < N - 1) {
        for (let c = 0; c < 2; c++) {
          const a = i * 3 + c;
          idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3);
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

  // --- Physics ---------------------------------------------------------
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
  const stepPhysics = (dt: number) => {
    if (dropT >= 0 && dropT < DROP) {
      dropT = Math.min(DROP, dropT + dt);
      anchor.x = ANCHOR_START.x * (1 - easeX(dropT / DROP));
      anchor.y = ANCHOR_START.y * (1 - easeY(dropT / DROP));
    }
    for (let s = 0; s < 2; s++) p[index(s, 0)].set(anchorX(s), ANCHOR_Y + anchor.y, 0);
    for (let i = 0; i <= END; i++) {
      if (!inv[i]) continue;
      // Webbing is limp: it loses its own motion quickly. The badge keeps swinging.
      const v = tmp.subVectors(p[i], prev[i]).multiplyScalar(i === END ? 0.9965 : 0.985);
      prev[i].copy(p[i]);
      p[i].add(v);
      p[i].y -= GRAVITY * dt * dt;
    }
    for (let k = 0; k < 12; k++) {
      for (let s = 0; s < 2; s++) {
        for (let i = 0; i < N - 1; i++) {
          const ia = index(s, i), ib = index(s, i + 1);
          const w = inv[ia] + inv[ib];
          const d = tmp.subVectors(p[ib], p[ia]);
          const len = d.length() || 1e-6;
          // Webbing does not push back: it only pulls when stretched, so a
          // strap that loses its load goes slack and bows.
          if (len <= SEG) continue;
          d.multiplyScalar((len - SEG) / len / w);
          p[ia].addScaledVector(d, inv[ia]);
          p[ib].addScaledVector(d, -inv[ib]);
        }
      }
    }
    // The plate is a pendulum hanging from the swivel, pushed by how the end
    // of the straps accelerates.
    endVel.subVectors(p[END], prev[END]).divideScalar(dt);
    // Bounded, so a snap of the straps tilts the plate but never flips it.
    const bound = (a: number) => Math.max(-90, Math.min(90, a));
    const ax = bound((endVel.x - lastEndVel.x) / dt);
    const ay = bound((endVel.y - lastEndVel.y) / dt);
    const az = bound((endVel.z - lastEndVel.z) / dt);
    lastEndVel.copy(endVel);
    const g = Math.max(GRAVITY * 0.4, GRAVITY + ay);
    rollV += (-(g / HANG) * Math.sin(roll) - (ax / HANG) * Math.cos(roll) - 1.3 * rollV) * dt;
    pitchV += (-(g / HANG) * Math.sin(pitch) + (az / HANG) * Math.cos(pitch) - 1.3 * pitchV) * dt;
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

  // --- Pose: the last two frames, blended for the motion blur ------------
  type Pose = { pts: Float32Array; roll: number; pitch: number; yaw: number };
  const pose = (): Pose => ({ pts: new Float32Array((END + 1) * 3), roll: 0, pitch: 0, yaw: REST_YAW });
  let from = pose(), to = pose();
  const capture = (out: Pose) => {
    for (let i = 0; i <= END; i++) p[i].toArray(out.pts, i * 3);
    out.roll = roll;
    out.pitch = pitch;
    out.yaw = yaw;
  };
  const q = p.map(() => new Vector3());
  const side = new Vector3();
  const tangent = new Vector3();
  const normal = new Vector3();
  const dir = new Vector3();
  const centre = new Vector3();
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const applyPose = (t: number) => {
    for (let i = 0; i <= END; i++) {
      q[i].set(
        mix(from.pts[i * 3], to.pts[i * 3], t),
        mix(from.pts[i * 3 + 1], to.pts[i * 3 + 1], t),
        mix(from.pts[i * 3 + 2], to.pts[i * 3 + 2], t),
      );
    }
    const r = mix(from.roll, to.roll, t), pi = mix(from.pitch, to.pitch, t), y = mix(from.yaw, to.yaw, t);
    const end = q[END];

    // The tab lines up with the straps above it.
    dir.copy(end).multiplyScalar(2).sub(q[index(0, N - 3)]).sub(q[index(1, N - 3)]).normalize();
    tabGroup.position.copy(end);
    tabGroup.rotation.set(Math.atan2(-dir.z, -dir.y) * 0.6 + pi * 0.3, 0, Math.atan2(dir.x, -dir.y) * 0.6 + r * 0.3);
    tabGroup.updateMatrixWorld();
    card.position.set(0, -JOINT, 0).applyMatrix4(tabGroup.matrixWorld);
    card.rotation.set(pi, y, r);
    card.updateMatrixWorld();
    sweep.value = -0.25 + (y - REST_YAW) * 0.55 + r * 0.5 + pi * 0.5;

    // The shadow falls down and to the right of the plate, thinner as it turns.
    centre.set(0, -HANG, 0).applyMatrix4(card.matrixWorld);
    shadow.position.set(centre.x + 0.15, centre.y - 0.17, -0.7);
    shadow.rotation.z = r;
    shadow.scale.x = Math.max(Math.abs(Math.cos(y)), 0.1);

    for (let s = 0; s < 2; s++) {
      const { geo, verts } = strands[s];
      for (let i = 0; i < N; i++) {
        const a = q[index(s, Math.max(0, i - 1))], b = q[index(s, Math.min(N - 1, i + 1))];
        tangent.subVectors(b, a).normalize();
        const u = i / (N - 1);
        side.set(1, 0, 0).addScaledVector(tangent, -tangent.x).normalize();
        normal.crossVectors(side, tangent);
        // Webbing keeps a memory of how it was rolled up: it never hangs
        // as a flat ruler, it waves and twists a little along its length.
        const ease = Math.sin(Math.PI * u);
        const twist = 0.45 * ease * Math.sin(5.3 * u + s * 2.1);
        side.multiplyScalar(Math.cos(twist)).addScaledVector(normal, Math.sin(twist));
        normal.crossVectors(side, tangent);
        const wave = 0.02 * ease * Math.sin(7.2 * u + s * 1.7) + (s ? -0.005 : 0.005);
        const c = q[index(s, i)];
        const cx = c.x + normal.x * wave, cy = c.y + normal.y * wave, cz = c.z + normal.z * wave;
        side.multiplyScalar(STRAP_W / 2);
        const o = i * 9;
        verts[o] = cx - side.x;
        verts[o + 1] = cy - side.y;
        verts[o + 2] = cz - side.z;
        verts[o + 3] = cx - normal.x * 0.01;
        verts[o + 4] = cy - normal.y * 0.01;
        verts[o + 5] = cz - normal.z * 0.01;
        verts[o + 6] = cx + side.x;
        verts[o + 7] = cy + side.y;
        verts[o + 8] = cz + side.z;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    }
  };

  // --- Render: scene to a multisampled target, blurred in time, then out --
  const float = renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float");
  const type = float ? HalfFloatType : UnsignedByteType;
  const sceneTarget = new WebGLRenderTarget(4, 4, { samples: 4, type });
  const sumTarget = new WebGLRenderTarget(4, 4, { type, depthBuffer: false });
  const addMaterial = new ShaderMaterial({
    uniforms: { tMap: { value: null }, uWeight: { value: 1 } },
    vertexShader: QUAD_VERTEX,
    fragmentShader:
      "uniform sampler2D tMap;\nuniform float uWeight;\nvarying vec2 vUv;\nvoid main() {\n  gl_FragColor = texture2D(tMap, vUv) * uWeight;\n}",
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  // Out to the page: tone mapping and sRGB on straight colour, premultiplied again for the canvas.
  const outMaterial = new ShaderMaterial({
    uniforms: { tMap: { value: null } },
    vertexShader: QUAD_VERTEX,
    fragmentShader: `uniform sampler2D tMap;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tMap, vUv);
        gl_FragColor = vec4(c.a > 0.0 ? c.rgb / c.a : vec3(0.0), clamp(c.a, 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb *= gl_FragColor.a;
      }`,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const addQuad = new FullScreenQuad(addMaterial);
  const outQuad = new FullScreenQuad(outMaterial);

  let pixelsPerUnit = 100;
  const setSize = (w: number, h: number, ratio: number) => {
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    const pw = Math.round(w * ratio), ph = Math.round(h * ratio);
    sceneTarget.setSize(pw, ph);
    sumTarget.setSize(pw, ph);
    pixelsPerUnit = ph / STAGE;
  };

  /**
   * Draws `samples` moments spread over the open shutter (`open`: the
   * share of the last frame it covers) and averages them.
   */
  const draw = (samples: number, open = 0) => {
    if (samples > 1) {
      renderer.setRenderTarget(sumTarget);
      renderer.clear();
    }
    for (let k = 0; k < samples; k++) {
      applyPose(1 - (open * (samples - 1 - k)) / samples);
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      if (samples > 1) {
        addMaterial.uniforms.tMap.value = sceneTarget.texture;
        addMaterial.uniforms.uWeight.value = 1 / samples;
        renderer.setRenderTarget(sumTarget);
        renderer.autoClear = false;
        addQuad.render(renderer);
        renderer.autoClear = true;
      }
    }
    outMaterial.uniforms.tMap.value = (samples > 1 ? sumTarget : sceneTarget).texture;
    renderer.setRenderTarget(null);
    outQuad.render(renderer);
  };

  // --- Loop: runs only while something moves --------------------------
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
  /** How far the badge moved on screen over the last frame, in pixels. */
  const travel = () => {
    const e = END * 3;
    const moved = Math.hypot(to.pts[e] - from.pts[e], to.pts[e + 1] - from.pts[e + 1]);
    const swung = Math.abs(to.roll - from.roll) * (HANG + PLATE_H / 2) + Math.abs(to.pitch - from.pitch) * HANG;
    const turned = Math.abs(to.yaw - from.yaw) * (PLATE_W / 2);
    return (moved + swung + turned) * pixelsPerUnit;
  };
  const tick = (_t: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    acc += dt;
    [from, to] = [to, from];
    while (acc >= STEP) {
      stepPhysics(STEP);
      acc -= STEP;
    }
    capture(to);
    // One sample per ~2.5 px of travel while the shutter is open: sharp when
    // slow, a soft trail when fast. The trail is capped (it is meant to be
    // faint), which also keeps a slow frame from splitting it into ghosts.
    let open = Math.min(1, SHUTTER / dt);
    const px = travel() * open;
    const samples = Math.max(1, Math.min(MAX_SAMPLES, Math.ceil(Math.min(px, MAX_BLUR) / 2.5)));
    if (px > MAX_BLUR) open *= MAX_BLUR / px;
    draw(samples, open);
    calm = energy() < 0.01 ? calm + 1 : 0;
    if (dropT >= DROP && calm > 40) stop();
  };
  const start = () => {
    if (running || !active || lost) return;
    running = true;
    calm = 0;
    acc = 0;
    gsap.ticker.add(tick);
  };
  const stop = () => {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
    // Leave a sharp frame behind.
    capture(to);
    capture(from);
    draw(1);
  };

  const still = () => {
    capture(to);
    capture(from);
    draw(1);
  };
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    setSize(w, h, Math.min(window.devicePixelRatio, 2, Math.sqrt(PIXEL_BUDGET / (w * h))));
    if (!running) still();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    if (running) {
      running = false;
      gsap.ticker.remove(tick);
    }
    // Our own dispose() drops the context on purpose: not a loss to report.
    if (!disposed) onLost();
  });

  capture(to);
  capture(from);
  applyPose(1);
  host.appendChild(canvas);
  setSize(host.clientWidth || 300, host.clientHeight || 300, 1);
  // Compile off the main thread where the browser can (for the target the scene is drawn to).
  renderer.setRenderTarget(sceneTarget);
  await renderer.compileAsync(scene, camera);
  renderer.setRenderTarget(null);
  resize();

  return {
    canvas,
    enter() {
      if (dropT < 0) dropT = 0;
      start();
    },
    setTurn(progress) {
      turn = progress;
      if (dropT >= 0) start();
    },
    setActive(on) {
      active = on;
      if (on && dropT >= 0) start();
      else if (running) {
        running = false;
        gsap.ticker.remove(tick);
      }
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
      setSize(size, size, 1);
      still();
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
      if (running) {
        running = false;
        gsap.ticker.remove(tick);
      }
      ro.disconnect();
      scene.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: Material) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
      addQuad.dispose();
      outQuad.dispose();
      addMaterial.dispose();
      outMaterial.dispose();
      sceneTarget.dispose();
      sumTarget.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
