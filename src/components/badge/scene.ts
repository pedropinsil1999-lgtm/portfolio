import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  Shape,
  SphereGeometry,
  Path,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { gsap } from "@/lib/gsap";
import { drawPrints, drawStrap, PRINT_H, PRINT_W, type BadgeCopy } from "./prints";

/*
 * World units: the acrylic plate is 1 wide (about 8.6 cm in real life).
 * The view box is 3:4 and frames the plate in its lower half, with the
 * strap running up out of the top edge and room on both sides to swing.
 */
export const BOX_ASPECT = 3 / 4;
const VIEW_H = 8 / 3; // world height seen at z = 0
const FOV = 20;
const CAM_Z = VIEW_H / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);

const PLATE_W = 1;
const PLATE_H = 1.42;
const DEPTH = 0.028; // plus the bevel on both faces: 4 mm acrylic
const BEVEL = 0.006;
const SLOT_Y = PLATE_H / 2 - 0.085;
const HANG = 0.8; // from the top of the clip to the centre of the plate

// Rest pose: the plate's lower edge just above the bottom of the box.
const PLATE_REST_Y = -VIEW_H / 2 + 0.08 + PLATE_H / 2;
const END_REST_Y = PLATE_REST_Y + HANG;
const ANCHOR_Y = VIEW_H / 2 + 0.7;
const ANCHOR_START = { x: 0.55, y: ANCHOR_Y + 3.4 };

// Physics, tuned to the period of a real badge on a long lanyard.
const N = 18;
const SEG = (ANCHOR_Y - END_REST_Y) / (N - 1);
const GRAVITY = 40;
const STEP = 1 / 120;
const STRAP_W = 0.15;
// At rest it hangs a little turned, the way a badge does, which shows its thickness.
const REST_YAW = -0.32;

export type BadgeScene = {
  canvas: HTMLCanvasElement;
  /** Drops the badge in on its strap. */
  enter(): void;
  /** 0 = front, 1 = turned round to the back. */
  setTurn(progress: number): void;
  /** Stops all work while the hero is off screen. */
  setActive(active: boolean): void;
  /** A still of the badge at rest, as a PNG data URL (for phones). */
  snapshot(width: number, height: number): string;
  dispose(): void;
};

/** Where the glint sits on the acrylic; moved as the badge turns. */
const sweep = { value: -0.2 };

/**
 * Acrylic: shows only its reflections (alpha from their brightness), plus a
 * faint body. A flat sheet reflects the same thing across its whole face, so
 * a soft diagonal glint is added on the surface, sliding as it turns.
 */
function acrylic(body: number, tint: Color, glint: number) {
  const m = new MeshPhysicalMaterial({
    color: 0x000000,
    roughness: 0.05,
    metalness: 0,
    ior: 1.5,
    specularIntensity: 1,
    clearcoat: 0.6,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.6,
    transparent: true,
    depthWrite: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBody = { value: body };
    shader.uniforms.uTint = { value: tint };
    shader.uniforms.uSweep = sweep;
    shader.uniforms.uGlint = { value: glint };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying vec3 vLocal;\nvoid main() {")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocal = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform float uBody;\nuniform vec3 uTint;\nuniform float uSweep;\nuniform float uGlint;\nvarying vec3 vLocal;\nvoid main() {",
      )
      .replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        vec3 refl = gl_FragColor.rgb;
        float d = vLocal.x + vLocal.y * 0.45 - uSweep;
        refl += uGlint * (exp(-pow(d / 0.2, 2.0)) * 0.13 + exp(-pow((d - 0.26) / 0.035, 2.0)) * 0.17);
        float lum = clamp(max(max(refl.r, refl.g), refl.b), 0.0, 1.0);
        float a = clamp(lum + uBody, 0.0, 1.0);
        gl_FragColor = vec4(min((refl + uTint * uBody) / max(a, 1e-4), vec3(1.0)), a);`,
      );
  };
  return m;
}

/**
 * What the shiny parts reflect: a dark studio around the page's navy with a
 * few softboxes, so the acrylic and steel catch long streaks of light.
 */
function studioScene() {
  const s = new Scene();
  const room = new Mesh(
    new SphereGeometry(20, 32, 16),
    new MeshBasicMaterial({ color: new Color(0.03, 0.09, 0.13), side: BackSide }),
  );
  s.add(room);
  const softbox = (w: number, h: number, power: number, pos: [number, number, number]) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color().setScalar(power), side: DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  softbox(1.6, 9, 9, [5, 1, 4]); // tall strip, front right: flashes across the face as it turns
  softbox(9, 2, 3.5, [0, 6, 3]); // overhead
  softbox(1.2, 8, 5, [-5, 0, 1]); // left: lights the edge
  softbox(10, 6, 0.35, [0, -1, 9]); // soft fill from behind the viewer
  return s;
}

/** The plate: a rounded rectangle with a slot for the ring, beveled like cut acrylic. */
function plateGeometry() {
  const w = PLATE_W - BEVEL * 2;
  const h = PLATE_H - BEVEL * 2;
  const r = 0.07;
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
  const sw = 0.12, sh = 0.026 + BEVEL; // half sizes of the slot
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

export async function createBadgeScene(
  host: HTMLElement,
  copy: BadgeCopy,
  { onLost }: { onLost: () => void },
): Promise<BadgeScene> {
  const [{ front, back }, strap] = await Promise.all([drawPrints(copy), Promise.resolve(drawStrap())]);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  const key = new DirectionalLight(0xffffff, 1.3);
  key.position.set(-2, 2.5, 3);
  scene.add(key);

  const camera = new PerspectiveCamera(FOV, BOX_ASPECT, 0.1, 50);
  camera.position.set(0, 0, CAM_Z);
  camera.lookAt(0, 0, 0);

  const textures: Texture[] = [];
  const texture = (c: HTMLCanvasElement) => {
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(t);
    return t;
  };

  // The card: pivot at the top of the clip.
  const card = new Group();
  card.rotation.order = "ZXY";
  scene.add(card);

  const plate = new Group();
  plate.position.y = -HANG;
  card.add(plate);

  const printW = PLATE_W - 0.12;
  const printH = (printW * PRINT_H) / PRINT_W;
  const printY = SLOT_Y - 0.075 - printH / 2;
  const print = (map: Texture, z: number, flip: boolean) => {
    const m = new MeshStandardMaterial({
      map,
      emissiveMap: map,
      emissive: 0xffffff,
      emissiveIntensity: 0.4,
      roughness: 0.55,
      envMapIntensity: 0.55,
      alphaTest: 0.5,
    });
    const mesh = new Mesh(new PlaneGeometry(printW, printH), m);
    mesh.position.set(0, printY, z);
    if (flip) mesh.rotation.y = Math.PI;
    plate.add(mesh);
  };
  print(texture(front), 0.004, false);
  print(texture(back), -0.004, true);

  const glass = new Mesh(plateGeometry(), [
    acrylic(0.03, new Color(0.85, 0.95, 1), 1),
    acrylic(0.4, new Color(0.7, 0.9, 1), 0),
  ]);
  glass.renderOrder = 2;
  plate.add(glass);

  // Hardware: a steel ring through the slot and a clip on the strap.
  const steel = new MeshStandardMaterial({ color: 0xe3ebef, metalness: 1, roughness: 0.16, envMapIntensity: 1.6 });
  const ringR = 0.055;
  const ring = new Mesh(new TorusGeometry(ringR, 0.011, 16, 48), steel);
  ring.rotation.y = Math.PI / 2;
  ring.position.y = -HANG + SLOT_Y - 0.026 + ringR;
  card.add(ring);
  // Crimp clip at the end of the webbing, then a small link down to the ring.
  const clip = new Mesh(new RoundedBoxGeometry(0.17, 0.075, 0.03, 4, 0.012), steel);
  clip.position.y = -0.035;
  card.add(clip);
  const link = new Mesh(new TorusGeometry(0.03, 0.008, 12, 32), steel);
  link.position.y = -0.09;
  card.add(link);

  // The strap: a ribbon along a simulated rope.
  const strapTex = texture(strap.canvas);
  strapTex.wrapS = strapTex.wrapT = RepeatWrapping;
  const strapGeo = new BufferGeometry();
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
  strapGeo.setAttribute("position", new BufferAttribute(verts, 3));
  strapGeo.setAttribute("uv", new BufferAttribute(uvs, 2));
  strapGeo.setIndex(idx);
  const strapMesh = new Mesh(
    strapGeo,
    new MeshStandardMaterial({ map: strapTex, color: 0xd2dbe0, roughness: 0.9, side: DoubleSide, envMapIntensity: 0.6 }),
  );
  strapMesh.frustumCulled = false;
  scene.add(strapMesh);

  // --- Physics ---------------------------------------------------------
  const anchor = { x: ANCHOR_START.x, y: ANCHOR_START.y };
  const p = Array.from({ length: N }, (_, i) => new Vector3(anchor.x, anchor.y - i * SEG, 0));
  const prev = p.map((v) => v.clone());
  const inv = p.map((_, i) => (i === 0 ? 0 : i === N - 1 ? 0.2 : 1));
  const endVel = new Vector3();
  const lastEndVel = new Vector3();
  // Swing of the card about the clip (roll, pitch), and its turn (yaw).
  let roll = 0, rollV = 0, pitch = 0, pitchV = 0, yaw = REST_YAW, yawV = 0, turn = 0;
  let entered = false;

  const tmp = new Vector3();
  const stepPhysics = (dt: number) => {
    p[0].set(anchor.x, anchor.y, 0);
    for (let i = 1; i < N; i++) {
      const v = tmp.subVectors(p[i], prev[i]).multiplyScalar(0.996);
      prev[i].copy(p[i]);
      p[i].add(v);
      p[i].y -= GRAVITY * dt * dt;
    }
    for (let k = 0; k < 14; k++) {
      for (let i = 0; i < N - 1; i++) {
        const a = p[i], b = p[i + 1];
        const d = tmp.subVectors(b, a);
        const len = d.length() || 1e-6;
        const w = inv[i] + inv[i + 1];
        if (!w) continue;
        d.multiplyScalar((len - SEG) / len / w);
        a.addScaledVector(d, inv[i]);
        b.addScaledVector(d, -inv[i + 1]);
      }
    }
    // The card is a pendulum hanging from the end of the strap, pushed by
    // how that end accelerates.
    endVel.subVectors(p[N - 1], prev[N - 1]).divideScalar(dt);
    const ax = (endVel.x - lastEndVel.x) / dt;
    const ay = (endVel.y - lastEndVel.y) / dt;
    const az = (endVel.z - lastEndVel.z) / dt;
    lastEndVel.copy(endVel);
    const g = Math.max(0, GRAVITY + ay);
    rollV += (-(g / HANG) * Math.sin(roll) - (ax / HANG) * Math.cos(roll) - 1.4 * rollV) * dt;
    pitchV += (-(g / HANG) * Math.sin(pitch) + (az / HANG) * Math.cos(pitch) - 1.4 * pitchV) * dt;
    roll += rollV * dt;
    pitch += pitchV * dt;
    // The turn: the strap twists, so it springs round with a little overshoot.
    const target = REST_YAW + turn * Math.PI;
    yawV += (32 * (target - yaw) - 7 * yawV) * dt;
    yaw += yawV * dt;
  };

  const side = new Vector3();
  const tangent = new Vector3();
  const normal = new Vector3();
  const updateMeshes = () => {
    const end = p[N - 1];
    card.position.copy(end);
    card.rotation.set(pitch, yaw, roll);
    sweep.value = -0.2 + (yaw - REST_YAW) * 0.55 + roll * 0.4;
    for (let i = 0; i < N; i++) {
      const a = p[Math.max(0, i - 1)], b = p[Math.min(N - 1, i + 1)];
      tangent.subVectors(b, a).normalize();
      // The strap twists more toward the card.
      const s = i / (N - 1);
      const tw = yaw * s * s;
      side.set(Math.cos(tw), 0, -Math.sin(tw));
      side.addScaledVector(tangent, -side.dot(tangent)).normalize();
      normal.crossVectors(side, tangent);
      side.multiplyScalar(STRAP_W / 2);
      const o = i * 9;
      verts[o] = p[i].x - side.x;
      verts[o + 1] = p[i].y - side.y;
      verts[o + 2] = p[i].z - side.z;
      verts[o + 3] = p[i].x - normal.x * 0.012;
      verts[o + 4] = p[i].y - normal.y * 0.012;
      verts[o + 5] = p[i].z - normal.z * 0.012;
      verts[o + 6] = p[i].x + side.x;
      verts[o + 7] = p[i].y + side.y;
      verts[o + 8] = p[i].z + side.z;
    }
    strapGeo.attributes.position.needsUpdate = true;
    strapGeo.computeVertexNormals();
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
    for (let i = 1; i < N; i++) e += p[i].distanceToSquared(prev[i]) * 1e4;
    return e;
  };
  const tick = (_t: number, deltaMs: number) => {
    acc += Math.min(deltaMs / 1000, 1 / 20);
    while (acc >= STEP) {
      stepPhysics(STEP);
      acc -= STEP;
    }
    updateMeshes();
    renderer.render(scene, camera);
    calm = energy() < 0.004 ? calm + 1 : 0;
    if (entered && calm > 40) stop();
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
  };

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    stop();
    // Our own dispose() drops the context on purpose: not a loss to report.
    if (!disposed) onLost();
  });

  updateMeshes();
  host.appendChild(canvas);
  resize();
  // Compile off the main thread where the browser can.
  await renderer.compileAsync(scene, camera);

  const settle = () => {
    anchor.x = 0;
    anchor.y = ANCHOR_Y;
    for (let i = 0; i < N; i++) {
      p[i].set(0, ANCHOR_Y - i * SEG, 0);
      prev[i].copy(p[i]);
    }
    endVel.set(0, 0, 0);
    lastEndVel.set(0, 0, 0);
    roll = rollV = pitch = pitchV = yawV = 0;
    yaw = REST_YAW + turn * Math.PI;
  };

  return {
    canvas,
    enter() {
      entered = true;
      start();
      gsap.to(anchor, { x: 0, duration: 1.1, ease: "power2.out" });
      // Arrives with a little give, like webbing taking the weight.
      gsap.to(anchor, { y: ANCHOR_Y, duration: 1.1, ease: "back.out(1.3)", onUpdate: start });
    },
    setTurn(progress) {
      turn = progress;
      start();
    },
    setActive(on) {
      active = on;
      if (on) start();
      else stop();
    },
    snapshot(width, height) {
      const was = { turn, entered };
      turn = 0;
      settle();
      updateMeshes();
      const ratio = renderer.getPixelRatio();
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
      const url = canvas.toDataURL("image/png");
      renderer.setPixelRatio(ratio);
      turn = was.turn;
      resize();
      return url;
    },
    dispose() {
      disposed = true;
      stop();
      gsap.killTweensOf(anchor);
      ro.disconnect();
      scene.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: Material) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
