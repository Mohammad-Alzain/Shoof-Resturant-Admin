import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * A burger on a plate on a dark oak table, lit like low-key food photography (warm key, red backlight).
 * Buns are photoscanned (Poly Haven "Hamburger Buns", CC0) and the table is Poly Haven "Black Oak Veneer" (CC0);
 * patty, cheese, tomato, lettuce, the plate and sesame seeds are built here. The layers fall onto the plate, the dish
 * turns, comes apart with labels and re-stacks; soft wisps of smoke wave above it. Drag to turn it.
 * Demonstration material authored for the sign-in stage, not a customer's dish.
 */

const BUNS_URL = `${import.meta.env.BASE_URL}models/hamburger_buns/hamburger_buns_1k.gltf`;
const TABLE_TEX = `${import.meta.env.BASE_URL}textures/table/black_oak`;

/* ---------- procedural textures ---------- */

const canvasTexture = (size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, srgb = true) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

// Deterministic pseudo-random so the dish is identical on every load.
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/** Seared beef: brown crust with pink-grey fat flecks and charred grill bars. Also used as the bump map. */
const pattyTexture = () =>
  canvasTexture(1024, (ctx, s) => {
    const rand = rng(7);
    ctx.fillStyle = "#5b3521";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 14000; i++) {
      const l = 22 + rand() * 30;
      ctx.fillStyle = `hsl(${16 + rand() * 14} ${22 + rand() * 20}% ${l - 4}%)`;
      ctx.beginPath();
      ctx.arc(rand() * s, rand() * s, 1 + rand() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // fat and juice flecks
    for (let i = 0; i < 1100; i++) {
      ctx.fillStyle = `rgba(236,190,150,${0.2 + rand() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(rand() * s, rand() * s, 2 + rand() * 6, 1 + rand() * 3, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // charred grill bars, softened edges
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(-Math.PI / 5);
    for (let i = -7; i <= 7; i++) {
      const g = ctx.createLinearGradient(0, i * 120 - 24, 0, i * 120 + 24);
      g.addColorStop(0, "rgba(40,18,8,0)");
      g.addColorStop(0.5, "rgba(24,12,6,0.6)");
      g.addColorStop(1, "rgba(40,18,8,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-s, i * 120 - 24, s * 2, 48);
    }
    ctx.restore();
  });

/** Tomato slice: skin ring, gel chambers with seeds, pale core. */
const tomatoTexture = () =>
  canvasTexture(1024, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 20, c, c, c);
    g.addColorStop(0, "#f0674a");
    g.addColorStop(0.78, "#d8321c");
    g.addColorStop(0.93, "#a82314");
    g.addColorStop(1, "#7d160b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const rand = rng(11);
    const chambers = 5;
    for (let k = 0; k < chambers; k++) {
      const a = (k / chambers) * Math.PI * 2 + 0.3;
      const cx = c + Math.cos(a) * 250;
      const cy = c + Math.sin(a) * 250;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150);
      grad.addColorStop(0, "rgba(255,168,92,0.95)");
      grad.addColorStop(0.7, "rgba(255,140,70,0.75)");
      grad.addColorStop(1, "rgba(255,120,60,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 150, 115, a, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 9; i++) {
        const sa = rand() * Math.PI * 2;
        const sr = rand() * 90;
        ctx.fillStyle = "rgba(255,238,184,0.95)";
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(sa) * sr, cy + Math.sin(sa) * sr, 15, 8.5, sa, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,206,176,0.6)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a + Math.PI / chambers) * 70, c + Math.sin(a + Math.PI / chambers) * 70);
      ctx.lineTo(c + Math.cos(a + Math.PI / chambers) * 430, c + Math.sin(a + Math.PI / chambers) * 430);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,226,196,0.85)";
    ctx.beginPath();
    ctx.arc(c, c, 48, 0, Math.PI * 2);
    ctx.fill();
  });

/** Veined leaf: lighter ribs on a mottled green, used as colour and bump. */
const lettuceTexture = () =>
  canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = "#7db444";
    ctx.fillRect(0, 0, s, s);
    const rand = rng(31);
    for (let i = 0; i < 3200; i++) {
      ctx.fillStyle = `hsla(${86 + rand() * 22} ${48 + rand() * 25}% ${34 + rand() * 32}% / .4)`;
      ctx.beginPath();
      ctx.arc(rand() * s, rand() * s, 3 + rand() * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2 + rand() * 0.2;
      ctx.strokeStyle = "rgba(226,244,176,0.55)";
      ctx.lineWidth = 5 + rand() * 6;
      ctx.beginPath();
      ctx.moveTo(s / 2, s / 2);
      ctx.quadraticCurveTo(s / 2 + Math.cos(a + 0.3) * 200, s / 2 + Math.sin(a + 0.3) * 200, s / 2 + Math.cos(a) * 520, s / 2 + Math.sin(a) * 520);
      ctx.stroke();
      ctx.strokeStyle = "rgba(226,244,176,0.3)";
      ctx.lineWidth = 2;
      for (let b = 0; b < 4; b++) {
        const t = 0.25 + b * 0.18;
        const px = s / 2 + Math.cos(a) * 520 * t;
        const py = s / 2 + Math.sin(a) * 520 * t;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a + 0.9) * 90, py + Math.sin(a + 0.9) * 90);
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a - 0.9) * 90, py + Math.sin(a - 0.9) * 90);
        ctx.stroke();
      }
    }
  });

/* ---------- geometry ---------- */

/** Smooth value noise in 3D (deterministic), used to give the beef its lumpy ground texture. */
const hash3 = (x: number, y: number, z: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const noise3 = (x: number, y: number, z: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
};

const PATTY_H = 0.37;
const pattyGeometry = () => {
  // bottom centre -> rounded side -> slightly domed top; dense rings so the surface can carry detail
  const prof: [number, number][] = [
    [0, 0], [0.4, 0], [0.8, 0], [0.95, 0.008], [1.04, 0.04], [1.09, 0.1], [1.1, 0.17], [1.09, 0.24], [1.05, 0.3],
    [0.98, 0.34], [0.88, 0.358], [0.76, 0.364], [0.62, 0.368], [0.48, 0.37], [0.34, 0.372], [0.2, 0.373], [0, 0.374],
  ];
  const geo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 200);
  geo.computeVertexNormals();
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = geo.getAttribute("uv");
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    // ground beef: two octaves of lumps plus fine grain, pushed along the surface normal
    const n =
      (noise3(x * 6, y * 6, z * 6) - 0.5) * 0.05 +
      (noise3(x * 15 + 7, y * 15, z * 15) - 0.5) * 0.022 +
      (noise3(x * 34, y * 34 + 3, z * 34) - 0.5) * 0.008;
    pos.setXYZ(i, x + nor.getX(i) * n, y + nor.getY(i) * n, z + nor.getZ(i) * n);
    // planar mapping so the seared crust and grill bars read from above
    uv.setXY(i, x * 0.46 + 0.5, z * 0.46 + 0.5);
    // the rim and underside are darker (seared), the top centre lighter
    const rim = Math.min(1, Math.max(0, (r - 0.85) / 0.25));
    const under = y < 0.05 ? 0.55 : 1;
    const k = (1 - rim * 0.38) * under;
    colors.set([k, k * 0.96, k * 0.93], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.translate(0, -PATTY_H / 2, 0);
  geo.computeVertexNormals();
  return geo;
};

const cheeseGeometry = () => {
  const geo = new THREE.BoxGeometry(1.62, 0.05, 1.62, 28, 1, 28);
  geo.rotateY(Math.PI / 4);
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const over = Math.max(0, r - 0.8);
    // melted: drapes over the patty rim, with a soft wavy edge
    pos.setY(i, pos.getY(i) - over * over * 0.8 - Math.sin(Math.atan2(z, x) * 7) * 0.02 * over + Math.sin(x * 5) * Math.sin(z * 4) * 0.01);
  }
  geo.computeVertexNormals();
  return geo;
};

const lettuceGeometry = () => {
  const radii = [0, 0.3, 0.6, 0.85, 1.0, 1.14, 1.3];
  const profile = radii.map((r) => new THREE.Vector2(r, 0.075));
  profile.push(new THREE.Vector2(1.3, 0), new THREE.Vector2(0, 0));
  const geo = new THREE.LatheGeometry(profile, 180);
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const a = Math.atan2(z, x);
    const k = Math.pow(Math.min(r / 1.3, 1), 1.6);
    pos.setY(i, pos.getY(i) + (Math.sin(a * 9) * 0.11 + Math.sin(a * 17 + 1.3) * 0.06 + Math.sin(a * 31) * 0.02) * k - k * 0.08);
    const ruffle = 1 + Math.sin(a * 13) * 0.025 * k;
    pos.setX(i, x * ruffle);
    pos.setZ(i, z * ruffle);
  }
  const luv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) luv.setXY(i, pos.getX(i) * 0.4 + 0.5, pos.getZ(i) * 0.4 + 0.5);
  geo.computeVertexNormals();
  return geo;
};

/** Plate: a dark oxblood glazed dinner plate, rim up, shallow well. Top of the well is y = 0. */
const plateGeometry = () => {
  const top: [number, number][] = [[0, 0], [1.1, 0], [1.3, 0.012], [1.5, 0.07], [1.68, 0.17], [1.82, 0.215], [1.86, 0.205]];
  const under: [number, number][] = [[1.84, 0.18], [1.7, 0.13], [1.5, 0.02], [1.2, -0.05], [0.9, -0.06], [0, -0.06]];
  return new THREE.LatheGeometry([...top, ...under].map(([x, y]) => new THREE.Vector2(x, y)), 160);
};

/* ---------- component ---------- */

/** Timeline in seconds: the layers fall onto the plate, the dish rests and turns, comes apart, re-stacks. */
const T_DROP = 2.0;
const T_REST = 6;
const T_APART = 3.6;
const T_RESTACK = 2.2;
const T_LOOP = T_REST + T_APART + T_RESTACK;

interface Props {
  /** Called when WebGL is unavailable so the caller can show a still instead. */
  onUnsupported?: () => void;
  /** Layer names shown beside the dish while it is apart, bottom to top. */
  labels?: string[];
  ariaLabel?: string;
  reducedMotion?: boolean;
}

export default function Dish3D({ onUnsupported, labels = [], ariaLabel = "3D burger", reducedMotion = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onUnsupported });
  callbacks.current = { onUnsupported };
  const labelKey = labels.join("|");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      callbacks.current.onUnsupported?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#120a08", 0.036);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.3;

    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);

    /* low-key lighting: warm key from the front-left, red backlight, almost no fill */
    const key = new THREE.SpotLight("#ffd5a0", 420, 0, 0.5, 0.85, 2);
    key.position.set(-3.4, 7.2, 4.2);
    key.target.position.set(0, 0.7, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0003;
    key.shadow.radius = 7;
    scene.add(key, key.target);
    const back = new THREE.SpotLight("#b95035", 230, 0, 0.7, 0.9, 2);
    back.position.set(3.2, 3.4, -5.2);
    back.target.position.set(0, 0.9, 0);
    scene.add(back, back.target);
    scene.add(new THREE.HemisphereLight("#3a1c1c", "#0a0504", 0.25));

    const disposables: { dispose(): void }[] = [envTexture, pmrem];
    const track = <T extends { dispose(): void }>(d: T) => {
      disposables.push(d);
      return d;
    };

    /* table: dark oak, fading to black away from the plate */
    const loader = new THREE.TextureLoader();
    const tableTex = (suffix: string, srgb: boolean) => {
      const tex = track(loader.load(`${TABLE_TEX}_${suffix}_1k.jpg`));
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(7, 7);
      tex.anisotropy = 8;
      if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const tableMat = track(
      new THREE.MeshStandardMaterial({
        map: tableTex("diff", true),
        normalMap: tableTex("nor_gl", false),
        roughnessMap: tableTex("rough", false),
        color: new THREE.Color("#8a8480"),
        roughness: 1,
      }),
    );
    const table = new THREE.Mesh(track(new THREE.PlaneGeometry(140, 140)), tableMat);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.07;
    table.receiveShadow = true;
    scene.add(table);

    /* plate */
    const plateMat = track(
      new THREE.MeshPhysicalMaterial({ color: "#2b0b0e", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }),
    );
    const plate = new THREE.Mesh(track(plateGeometry()), plateMat);
    plate.castShadow = plate.receiveShadow = true;
    scene.add(plate);

    /* the burger */
    const burger = new THREE.Group();
    scene.add(burger);
    const layers: { obj: THREE.Object3D; base: number }[] = [];

    const pTex = track(pattyTexture());
    const tTex = track(tomatoTexture());
    const lTex = track(lettuceTexture());

    const place = (obj: THREE.Object3D, y: number) => {
      obj.position.y = y;
      layers.push({ obj, base: y });
      burger.add(obj);
    };
    const solid = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[]) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = m.receiveShadow = true;
      (Array.isArray(mat) ? mat : [mat]).forEach((x) => track(x));
      return m;
    };

        const pattyMat = new THREE.MeshPhysicalMaterial({
      map: pTex,
      bumpMap: pTex,
      bumpScale: 2.6,
      vertexColors: true,
      color: new THREE.Color("#d8b29a"),
      roughness: 0.46,
      clearcoat: 0.38,
      clearcoatRoughness: 0.38,
      sheen: 0.25,
      sheenColor: new THREE.Color("#ffb88a"),
    });
    const pattyObj = new THREE.Group();
    pattyObj.add(solid(track(pattyGeometry()), pattyMat));

    const cheeseMat = new THREE.MeshPhysicalMaterial({
      color: "#f3ad1c",
      roughness: 0.34,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      sheen: 0.5,
      sheenColor: new THREE.Color("#ffe29a"),
    });
    const cheeseObj = new THREE.Group();
    cheeseObj.add(solid(track(cheeseGeometry()), cheeseMat));

    const tomatoMats = [
      new THREE.MeshPhysicalMaterial({ color: "#bf2814", roughness: 0.3, clearcoat: 0.85 }),
      new THREE.MeshPhysicalMaterial({ map: tTex, roughness: 0.26, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ map: tTex, roughness: 0.26, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
    ];
    const tomatoObj = new THREE.Group();
    const sliceGeo = track(new THREE.CylinderGeometry(0.66, 0.64, 0.12, 72));
    const sliceA = solid(sliceGeo, tomatoMats);
    sliceA.position.set(-0.36, 0, 0.1);
    const sliceB = solid(sliceGeo, tomatoMats.map((m) => m.clone()));
    sliceB.position.set(0.4, 0.035, -0.18);
    sliceB.rotation.y = 1.9;
    tomatoObj.add(sliceA, sliceB);
    const onionMat = new THREE.MeshPhysicalMaterial({ color: "#d9a2c0", roughness: 0.3, clearcoat: 0.6, transparent: false });
    [0.52, 0.36, 0.2].forEach((r, i) => {
      const ringMesh = solid(track(new THREE.TorusGeometry(r, 0.032, 10, 56, Math.PI * (1.55 + i * 0.1))), i === 0 ? onionMat : onionMat.clone());
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.rotation.z = 0.9 + i * 0.6;
      ringMesh.position.set(0.05, 0.085 + i * 0.012, 0.05);
      tomatoObj.add(ringMesh);
    });

    const lettuceObj = new THREE.Group();
    lettuceObj.add(
      solid(
        track(lettuceGeometry()),
        new THREE.MeshPhysicalMaterial({ map: lTex, bumpMap: lTex, bumpScale: 1.2, color: new THREE.Color("#c9dfae"), roughness: 0.45, side: THREE.DoubleSide, sheen: 0.5, sheenColor: new THREE.Color("#d8f5a0"), clearcoat: 0.1, clearcoatRoughness: 0.5, emissive: new THREE.Color("#173a06"), emissiveIntensity: 0.08 }),
      ),
    );

    let buildDone = false;
    let loadedAt = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const bunLow = new THREE.Group();
    const bunHigh = new THREE.Group();

    /* load the photoscanned bun, then assemble the stack */
    new GLTFLoader().load(
      BUNS_URL,
      (gltf) => {
        if (disposed) return;
        let src: THREE.Mesh | undefined;
        gltf.scene.traverse((o) => {
          if (!src && o instanceof THREE.Mesh) src = o;
        });
        if (!src) return;
        const geo = track(src.geometry.clone());
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
        const s = 2.18 / Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z);

        const srcMat = src.material as THREE.MeshStandardMaterial;
        const bunMat = () => {
          const m = new THREE.MeshPhysicalMaterial({
            map: srcMat.map,
            normalMap: srcMat.normalMap,
            roughnessMap: srcMat.roughnessMap,
            roughness: 0.78,
            sheen: 0.6,
            sheenColor: new THREE.Color("#ffd7a0"),
            sheenRoughness: 0.6,
            color: new THREE.Color("#ffc78a"),
          });
          if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          return m;
        };

        // bottom bun: the scanned roll, flattened
        const bottom = solid(geo, bunMat());
        bottom.scale.set(s * 1.04, s * 0.62, s * 1.04);
        bunLow.add(bottom);

        // top bun: the scanned roll, domed, with sesame seeds laid on its surface
        const top = solid(geo, bunMat());
        top.scale.set(s, s * 0.7, s);
        bunHigh.add(top);
        top.updateMatrixWorld(true);
        const seedMat = track(new THREE.MeshPhysicalMaterial({ color: "#f6e7c4", roughness: 0.45, sheen: 0.4 }));
        const seeds = new THREE.InstancedMesh(track(new THREE.SphereGeometry(0.034, 12, 8)), seedMat, 70);
        seeds.castShadow = true;
        const ray = new THREE.Raycaster();
        const rand = rng(21);
        const dummy = new THREE.Object3D();
        const up = new THREE.Vector3(0, 1, 0);
        let placed = 0;
        for (let tries = 0; tries < 500 && placed < seeds.count; tries++) {
          const a = rand() * Math.PI * 2;
          const r = Math.sqrt(rand()) * 0.72;
          ray.set(new THREE.Vector3(Math.cos(a) * r, 4, Math.sin(a) * r), new THREE.Vector3(0, -1, 0));
          const hit = ray.intersectObject(top, false)[0];
          if (!hit || !hit.face) continue;
          const n = hit.face.normal.clone().transformDirection(top.matrixWorld).normalize();
          if (n.y < 0.55) continue;
          dummy.position.copy(hit.point).addScaledVector(n, 0.006);
          dummy.quaternion.setFromUnitVectors(up, n);
          dummy.rotateY(rand() * Math.PI);
          dummy.scale.set(1.55, 0.5, 0.75 + rand() * 0.3);
          dummy.updateMatrix();
          seeds.setMatrixAt(placed++, dummy.matrix);
        }
        seeds.count = placed;
        bunHigh.add(seeds);

        // stack, bottom to top
        // heights in world units; the patty sinks into the bottom bun's dome and the top bun rests on the lettuce
        place(bunLow, 0.012);
        place(pattyObj, 0.83);
        place(cheeseObj, 1.035);
        place(tomatoObj, 1.085);
        place(lettuceObj, 1.15);
        place(bunHigh, 1.19);

        buildDone = true;
        loadedAt = clock.elapsedTime;
      },
      undefined,
      () => callbacks.current.onUnsupported?.(),
    );

    /* smoke: three soft, wavy ribbons with a scrolling smoky texture */
    const smokeTex = track(new THREE.CanvasTexture(document.createElement("canvas")));
    {
      // a tall strip of blurred puffs, feathered at both side edges, tiling vertically
      const cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 512;
      const cx = cv.getContext("2d")!;
      const rand = rng(57);
      cx.filter = "blur(12px)";
      for (let i = 0; i < 300; i++) {
        const yy = rand() * 512;
        const rr = 22 + rand() * 34;
        const g = cx.createRadialGradient(64 + (rand() - 0.5) * 50, yy, 0, 64, yy, rr);
        g.addColorStop(0, `rgba(255,255,255,${0.14 + rand() * 0.14})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        cx.fillStyle = g;
        cx.fillRect(0, yy - rr, 128, rr * 2);
      }
      cx.filter = "none";
      cx.globalCompositeOperation = "destination-in";
      const edge = cx.createLinearGradient(0, 0, 128, 0);
      edge.addColorStop(0, "rgba(0,0,0,0)");
      edge.addColorStop(0.2, "rgba(0,0,0,0.35)");
      edge.addColorStop(0.38, "rgba(0,0,0,0.85)");
      edge.addColorStop(0.5, "rgba(0,0,0,1)");
      edge.addColorStop(0.62, "rgba(0,0,0,0.85)");
      edge.addColorStop(0.8, "rgba(0,0,0,0.35)");
      edge.addColorStop(1, "rgba(0,0,0,0)");
      cx.fillStyle = edge;
      cx.fillRect(0, 0, 128, 512);
      smokeTex.image = cv;
      smokeTex.colorSpace = THREE.SRGBColorSpace;
      smokeTex.wrapS = THREE.ClampToEdgeWrapping;
      smokeTex.wrapT = THREE.RepeatWrapping;
      smokeTex.needsUpdate = true;
    }
    const PTS = 40;
    const ribbonIndex: number[] = [];
    for (let i = 0; i < PTS - 1; i++) {
      const a = i * 2;
      ribbonIndex.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const wisps = [
      { ox: -0.26, phase: 0.0, amp: 0.11, freq: 1.15, speed: 0.55, width: 0.46 },
      { ox: -0.1, phase: 1.3, amp: 0.13, freq: 1.3, speed: 0.5, width: 0.56 },
      { ox: 0.04, phase: 2.6, amp: 0.14, freq: 1.4, speed: 0.46, width: 0.62 },
      { ox: 0.18, phase: 3.7, amp: 0.12, freq: 1.2, speed: 0.58, width: 0.52 },
      { ox: 0.32, phase: 5.1, amp: 0.1, freq: 1.25, speed: 0.6, width: 0.42 },
    ].map((cfg) => {
      const geo = track(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PTS * 2 * 3), 3));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(PTS * 2 * 4), 4));
      const uvs = new Float32Array(PTS * 2 * 2);
      for (let i = 0; i < PTS; i++) {
        const v = (i / (PTS - 1)) * 1.6 + cfg.phase * 0.3;
        uvs.set([0, v, 1, v], i * 4);
      }
      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(ribbonIndex);
      const mat = track(
        new THREE.MeshBasicMaterial({ map: smokeTex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }),
      );
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return { geo, ...cfg };
    });

    /* embers drifting in the dark */
    const DUST = 70;
    const dustPos = new Float32Array(DUST * 3);
    const dustSeed = rng(5);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (dustSeed() - 0.5) * 8;
      dustPos[i * 3 + 1] = dustSeed() * 4.2;
      dustPos[i * 3 + 2] = (dustSeed() - 0.5) * 5;
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = track(new THREE.PointsMaterial({ color: "#ff6a52", size: 0.03, transparent: true, opacity: 0.45, depthWrite: false }));
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    /* HTML labels that follow each layer while the dish is apart */
    const labelEls = labelKey
      ? labelKey.split("|").map((text) => {
          const el = document.createElement("div");
          el.textContent = text;
          el.style.cssText =
            "position:absolute;left:0;top:0;opacity:0;pointer-events:none;white-space:nowrap;font:600 12px/1 var(--font-display,system-ui);color:#ffe3df;letter-spacing:.02em;display:flex;align-items:center;gap:8px;will-change:transform,opacity";
          const line = document.createElement("span");
          line.style.cssText = "display:block;width:46px;height:1px;background:linear-gradient(90deg,rgba(255,90,77,0),rgba(255,90,77,.95))";
          el.prepend(line);
          host.appendChild(el);
          return el;
        })
      : [];

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* input: drag to turn, move to look around */
    let angle = 0.5;
    let velocity = 0;
    let dragging = false;
    let lastX = 0;
    let px = 0;
    let py = 0;
    const AUTO = reducedMotion ? 0.12 : 0.3;
    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      angle += dx * 0.011;
      velocity = dx * 0.011 * 60;
    };
    const onUp = () => {
      dragging = false;
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    /* dev-only: ?dish_t=5 freezes the timeline at second 5 (after the drop) so a moment can be inspected */
    const frozenAt = import.meta.env.DEV ? Number(new URLSearchParams(window.location.search).get("dish_t") ?? NaN) : NaN;
    const frozen = Number.isFinite(frozenAt) ? frozenAt : null;

    let raf = 0;
    let frames = 0;
    let camX = 0;
    let camY = 0;
    const ease = (t: number) => t * t * (3 - 2 * t);
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const tmp = new THREE.Vector3();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (!dragging) {
        velocity *= Math.pow(0.04, dt);
        angle += (AUTO + velocity) * dt;
      }
      burger.rotation.y = angle;
      burger.visible = buildDone;

      /* timeline: the layers fall onto the plate, then rest, come apart and re-stack */
      const sinceLoad = buildDone ? t - loadedAt : -1;
      const dropping = !reducedMotion && frozen === null && sinceLoad >= 0 && sinceLoad < T_DROP;
      const c = frozen ?? Math.max(0, sinceLoad - (reducedMotion ? 0 : T_DROP)) % T_LOOP;
      let apart = 0;
      if (!reducedMotion) {
        const a = c - T_REST;
        if (a > 0 && a < T_APART) apart = ease(clamp01(a / 1.6)) * (a > T_APART - 0.9 ? ease(clamp01((T_APART - a) / 0.9)) : 1);
        else if (a >= T_APART) apart = ease(1 - clamp01((a - T_APART) / T_RESTACK));
      }

      layers.forEach((l, i) => {
        // dropping: each layer falls onto the stack in turn
        const k = dropping ? easeOut(clamp01((sinceLoad - i * 0.18) / 0.9)) : 1;
        const yy = l.base + i * 0.3 * apart + (1 - k) * 3.2;
        l.obj.position.y = yy;
      });

      /* camera: low, long lens; slow dolly-in on load, gentle parallax */
      const intro = reducedMotion ? 1 : ease(clamp01(t / 2.4));
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      const aspect = w / h;
      const dist = Math.max(10.6, 11.7 / Math.min(1, aspect * 1.05)) * (1.16 - 0.16 * intro) * (1 + apart * 0.3);
      camX += ((reducedMotion ? 0 : px) * 0.8 - camX) * Math.min(1, dt * 2.4);
      camY += (-(reducedMotion ? 0 : py) * 0.4 - camY) * Math.min(1, dt * 2.4);
      camera.position.set(camX, dist * 0.27 + camY, dist);
      camera.lookAt(0, 0.95 + apart * 1.0, 0);

      // smoke: soft ribbons that rise in a slow wave, widen as they climb and fade at both ends
      const topY = layers.length ? layers[layers.length - 1].obj.position.y + 0.95 : 2;
      const calm = reducedMotion ? 0.55 : 1;
      const visible = buildDone && !dropping ? clamp01(sinceLoad - (reducedMotion ? 0 : T_DROP) + 0.5) : 0;
      smokeTex.offset.y = -t * 0.09 * calm;
      wisps.forEach((wp) => {
        const posAttr = wp.geo.getAttribute("position") as THREE.BufferAttribute;
        const colAttr = wp.geo.getAttribute("color") as THREE.BufferAttribute;
        for (let i = 0; i < PTS; i++) {
          const u = i / (PTS - 1);
          const cxp = wp.ox * (1 - u * 0.3) + Math.sin(u * wp.freq * Math.PI * 2 - t * wp.speed * calm + wp.phase) * wp.amp * (0.3 + u);
          const cy = topY - 0.1 + u * 1.25;
          const cz = Math.cos(u * 2.4 - t * 0.4 * calm + wp.phase) * 0.06 * u;
          const half = (wp.width * (0.35 + u * 0.9)) / 2;
          posAttr.setXYZ(i * 2, cxp - half, cy, cz);
          posAttr.setXYZ(i * 2 + 1, cxp + half, cy, cz);
          const fadeIn = ease(clamp01(u / 0.14));
          const fadeOut = Math.pow(1 - u, 1.8);
          const alpha = visible * 0.6 * fadeIn * fadeOut;
          colAttr.setXYZW(i * 2, 1, 0.95, 0.92, alpha);
          colAttr.setXYZW(i * 2 + 1, 1, 0.95, 0.92, alpha);
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      });

      dust.rotation.y = t * 0.02;

      camera.updateMatrixWorld();
      frames++;
      labelEls.forEach((lab, i) => {
        if (frames < 4) {
          lab.style.opacity = "0"; // the first frames have no settled camera matrices yet
          return;
        }
        const l = layers[Math.min(i, layers.length - 1)];
        if (!l) return;
        tmp.set(1.3, l.base + i * 0.3 * apart + 0.1, 0).project(camera);
        const sx = (tmp.x * 0.5 + 0.5) * w;
        const sy = (-tmp.y * 0.5 + 0.5) * h;
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) {
          lab.style.opacity = "0";
          return;
        }
        lab.style.transform = `translate(${sx + 10}px, ${sy - 6}px)`;
        lab.style.opacity = String(clamp01((apart - 0.55) * 2.2));
      });

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      labelEls.forEach((l) => l.remove());
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      el.remove();
    };
  }, [reducedMotion, labelKey]);

  return <div ref={hostRef} className="relative size-full overflow-hidden" role="img" aria-label={ariaLabel} />;
}
