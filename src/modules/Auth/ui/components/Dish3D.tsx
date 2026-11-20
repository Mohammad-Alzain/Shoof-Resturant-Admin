import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * The sufra: a mixed grill (mashawi) served in daylight on a glazed white-and-cobalt plate on a hammered brass tray, on a
 * za'atar-green linen cloth, with five mezze bowls set around it. Everything (flatbread, kofta, shish tawook, grilled
 * vegetables, steel skewers, garnish, plate, tray, bowls, cloth) is built here, no scanned assets. The bread lands on the
 * plate, the three skewers are laid on it one by one, then the mezze are served around the tray, cleared and served
 * again; the tray turns slowly. Drag to turn it. Demonstration material authored for the sign-in stage, not a customer's dish.
 */


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

/** Khubz: pale wheat flatbread with toasted blisters, a few char spots and a dusting of flour. Also used as the bump map. */
const breadTexture = () =>
  canvasTexture(1024, (ctx, s) => {
    const rand = rng(31);
    ctx.fillStyle = "#dcb979";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `hsl(${34 + rand() * 9} ${42 + rand() * 18}% ${68 + rand() * 14}% / 0.35)`;
      ctx.beginPath();
      ctx.arc(rand() * s, rand() * s, 2 + rand() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    // toasted blisters where the dough puffed against the oven floor
    for (let i = 0; i < 240; i++) {
      const x = rand() * s, y = rand() * s, r = 6 + rand() * 28;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(146,88,36,${0.45 + rand() * 0.4})`);
      g.addColorStop(0.55, "rgba(172,114,54,0.25)");
      g.addColorStop(1, "rgba(200,150,90,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(58,30,12,${0.4 + rand() * 0.4})`;
      ctx.beginPath();
      ctx.arc(rand() * s, rand() * s, 1.5 + rand() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = `rgba(255,250,236,${0.25 + rand() * 0.4})`;
      ctx.beginPath();
      ctx.arc(rand() * s, rand() * s, 0.8 + rand() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

/** Shish tawook: chicken in a yoghurt and paprika marinade, golden with charred grill marks. */
const tawookTexture = () =>
  canvasTexture(512, (ctx, s) => {
    const rand = rng(17);
    ctx.fillStyle = "#d58a3c";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `hsl(${26 + rand() * 14} ${58 + rand() * 18}% ${44 + rand() * 18}% / 0.5)`;
      ctx.beginPath();
      ctx.arc(rand() * s, rand() * s, 1 + rand() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(246,222,176,${0.15 + rand() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(rand() * s, rand() * s, 3 + rand() * 8, 1 + rand() * 3, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(Math.PI / 6);
    for (let i = -5; i <= 5; i++) {
      const g = ctx.createLinearGradient(0, i * 70 - 14, 0, i * 70 + 14);
      g.addColorStop(0, "rgba(60,26,8,0)");
      g.addColorStop(0.5, "rgba(48,20,6,0.62)");
      g.addColorStop(1, "rgba(60,26,8,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-s, i * 70 - 14, s * 2, 28);
    }
    ctx.restore();
  });

/** Za'atar-green linen: a fine plain weave with slubs, used as colour and bump. */
const clothTexture = () =>
  canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = "#2c5138";
    ctx.fillRect(0, 0, s, s);
    const rand = rng(41);
    // warp and weft threads, each with its own tone
    for (let y = 0; y < s; y += 4) {
      ctx.fillStyle = `rgba(${200 + rand() * 40},${230 + rand() * 25},${190 + rand() * 30},${0.035 + rand() * 0.05})`;
      ctx.fillRect(0, y, s, 2);
    }
    for (let x = 0; x < s; x += 4) {
      ctx.fillStyle = `rgba(0,${20 + rand() * 20},0,${0.06 + rand() * 0.07})`;
      ctx.fillRect(x, 0, 2, s);
    }
    // slubs: short thick bits of thread that make linen read as linen
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(214,236,200,${0.05 + rand() * 0.08})`;
      const horizontal = rand() > 0.5;
      ctx.fillRect(rand() * s, rand() * s, horizontal ? 8 + rand() * 26 : 2, horizontal ? 2 : 8 + rand() * 26);
    }
  });

/** Hammered brass: overlapping shallow dimples, used as a bump map. */
const hammeredTexture = () =>
  canvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      const rand = rng(77);
      for (let i = 0; i < 700; i++) {
        const x = rand() * s;
        const y = rand() * s;
        const r = 8 + rand() * 16;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(40,40,40,0.55)");
        g.addColorStop(0.7, "rgba(128,128,128,0.15)");
        g.addColorStop(1, "rgba(200,200,200,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    false,
  );

/** The top of a mezze: a base colour, a spoon swirl, an olive-oil pool, and specks (paprika, za'atar, parsley). */
const mezzeTexture = (base: string, specks: string[], oil: boolean, seed: number) =>
  canvasTexture(512, (ctx, s) => {
    const rand = rng(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 10;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, 70 + k * 55, rand() * 3, rand() * 3 + 3.6);
      ctx.stroke();
    }
    if (oil) {
      const g = ctx.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, 120);
      g.addColorStop(0, "rgba(214,170,40,0.85)");
      g.addColorStop(0.75, "rgba(196,150,30,0.6)");
      g.addColorStop(1, "rgba(196,150,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, 120, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = specks[Math.floor(rand() * specks.length)];
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * s * 0.48;
      ctx.beginPath();
      ctx.ellipse(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 2 + rand() * 5, 1.5 + rand() * 3, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
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

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** The flatbread: a thin, slightly puffed disc with an irregular edge that rides up the plate's rim. Top near y = 0.05. */
const breadGeometry = () => {
  const prof: [number, number][] = [[0, 0.045], [0.6, 0.048], [1.1, 0.046], [1.36, 0.04], [1.46, 0.025], [1.49, 0.008], [1.44, -0.006], [1.2, -0.01], [0, -0.01]];
  const geo = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 160);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const wob = 1 + Math.sin(a * 3 + 0.4) * 0.025 + Math.sin(a * 7) * 0.012;
    x *= wob;
    z *= wob;
    const r = Math.hypot(x, z);
    if (y > 0.02) y += (noise3(x * 3, 0, z * 3) - 0.4) * 0.05; // puffed pockets
    y += Math.max(0, r - 1.05) ** 2 * 0.42; // the edge lies on the rising rim
    pos.setXYZ(i, x, y, z);
    uv.setXY(i, x * 0.3 + 0.5, z * 0.3 + 0.5);
  }
  geo.computeVertexNormals();
  return geo;
};

/** Kofta: minced lamb pressed by hand along the skewer, lumpy, with finger ridges and charred patches. Along x. */
const koftaGeometry = () => {
  const geo = new THREE.CapsuleGeometry(0.15, 1.55, 10, 40);
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = geo.getAttribute("uv");
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n =
      (noise3(x * 9, y * 9, z * 9) - 0.5) * 0.05 + (noise3(x * 22 + 5, y * 22, z * 22) - 0.5) * 0.018 + Math.sin(y * 10.5) * 0.009;
    pos.setXYZ(i, x + nor.getX(i) * n, y + nor.getY(i) * n, z + nor.getZ(i) * n);
    uv.setXY(i, Math.atan2(z, x) / (Math.PI * 2) + 0.5, y * 0.32 + 0.5);
    const k = 1 - 0.42 * clamp((noise3(x * 5 + 11, y * 4, z * 5) - 0.55) * 4);
    colors.set([k, k * 0.95, k * 0.92], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.rotateZ(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
};

/** A chunk of chicken: a rounded, uneven cube whose corners caught the fire. */
const chunkGeometry = () => {
  const geo = new THREE.BoxGeometry(0.3, 0.28, 0.3, 8, 8, 8);
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length();
    v.lerp(v.clone().normalize().multiplyScalar(0.18), 0.42);
    v.multiplyScalar(1 + (noise3(v.x * 12, v.y * 12, v.z * 12) - 0.5) * 0.16);
    pos.setXYZ(i, v.x, v.y, v.z);
    const k = 1 - 0.6 * clamp((len - 0.19) / 0.05);
    colors.set([k, k * 0.93, k * 0.88], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
};

/** Half a grilled tomato: glossy, slightly wrinkled, with blistered dark patches. */
const tomatoGeometry = () => {
  const geo = new THREE.SphereGeometry(0.16, 32, 22);
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = (noise3(x * 30, y * 30, z * 30) - 0.5) * 0.014;
    pos.setXYZ(i, x + nor.getX(i) * n, y * 0.9 + nor.getY(i) * n, z + nor.getZ(i) * n);
    const k = 1 - 0.6 * clamp((noise3(x * 14 + 3, y * 14, z * 14) - 0.6) * 4);
    colors.set([k, k, k], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
};

/** A curved shell (an onion layer or a piece of pepper), arched over the skewer: axis along z, crown at y = r. */
const shellGeometry = (r: number, arc: number, width: number) => {
  const geo = new THREE.CylinderGeometry(r, r, width, 22, 1, true, Math.PI - arc / 2, arc);
  geo.rotateX(Math.PI / 2);
  return geo;
};

/** Plate: a glazed ivory dinner plate with a cobalt band on the rim, shallow well. Top of the well is y = 0. */
const plateGeometry = () => {
  const top: [number, number][] = [[0, 0], [1.1, 0], [1.3, 0.012], [1.5, 0.07], [1.68, 0.17], [1.82, 0.215], [1.86, 0.205]];
  const under: [number, number][] = [[1.84, 0.18], [1.7, 0.13], [1.5, 0.02], [1.2, -0.05], [0.9, -0.06], [0, -0.06]];
  const geo = new THREE.LatheGeometry([...top, ...under].map(([x, y]) => new THREE.Vector2(x, y)), 160);
  // hand-painted look: ivory glaze, a cobalt band on the rim and a thin turquoise line inside it
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const ivory = new THREE.Color("#f3efe4");
  const cobalt = new THREE.Color("#1e4a8c");
  const turquoise = new THREE.Color("#2b8f9a");
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    const y = pos.getY(i);
    const c = r > 1.6 && y > 0.09 ? cobalt : r > 1.44 && r < 1.54 && y > 0.03 ? turquoise : ivory;
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
};

/** Brass tray: a wide flat disc with a low raised lip. Top surface at y = 0. */
const trayGeometry = () => {
  const prof: [number, number][] = [[0, 0], [2.3, 0], [2.42, 0.02], [2.5, 0.09], [2.53, 0.12], [2.55, 0.1], [2.5, -0.02], [2.3, -0.05], [0, -0.05]];
  return new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 140);
};

/** A small mezze bowl: steep glazed sides on a foot. The filling surface sits at y = 0.2. */
const bowlGeometry = () => {
  const prof: [number, number][] = [[0, 0.04], [0.26, 0.03], [0.28, 0], [0.34, 0], [0.5, 0.1], [0.6, 0.25], [0.63, 0.27], [0.6, 0.27], [0.55, 0.22], [0.42, 0.12], [0, 0.1]];
  return new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 72);
};

/* ---------- component ---------- */

/** Timeline in seconds: the bread lands and the skewers are laid on it, then the mezze service loops (served, left, cleared). */
const T_DROP = 2.6;
const T_SERVICE = 14;

interface Props {
  /** Called when WebGL is unavailable so the caller can show a still instead. */
  onUnsupported?: () => void;
  /** Names of the five mezze, shown briefly as each bowl is served. */
  mezze?: string[];
  ariaLabel?: string;
  reducedMotion?: boolean;
}

export default function Dish3D({ onUnsupported, mezze = [], ariaLabel = "3D mixed grill", reducedMotion = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onUnsupported });
  callbacks.current = { onUnsupported };
  const mezzeKey = mezze.join("|");

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
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#1f3a2a", 0.03);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80);

    /* daylight from a window at the side, a soft sky fill and a warm rim off the brass */
    const key = new THREE.DirectionalLight("#fff1d8", 3.1);
    key.position.set(-5, 9, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = key.shadow.camera.bottom = -7;
    key.shadow.camera.right = key.shadow.camera.top = 7;
    key.shadow.bias = -0.0015;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 6;
    scene.add(key, key.target);
    const rim = new THREE.SpotLight("#ffe2a8", 120, 0, 0.8, 0.9, 2);
    rim.position.set(4, 4.5, -5);
    rim.target.position.set(0, 0.9, 0);
    scene.add(rim, rim.target);
    scene.add(new THREE.HemisphereLight("#eef4e6", "#24412f", 0.9));

    const disposables: { dispose(): void }[] = [envTexture, pmrem];
    const track = <T extends { dispose(): void }>(d: T) => {
      disposables.push(d);
      return d;
    };

    /* table: za'atar-green linen, fading into the green fog away from the tray */
    const cloth = track(clothTexture());
    cloth.repeat.set(26, 26);
    const tableMat = track(
      new THREE.MeshStandardMaterial({ map: cloth, bumpMap: cloth, bumpScale: 0.6, color: new THREE.Color("#d6e6d0"), roughness: 0.95 }),
    );
    const table = new THREE.Mesh(track(new THREE.PlaneGeometry(140, 140)), tableMat);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.07;
    table.receiveShadow = true;
    scene.add(table);

    /* the turning tray carries the plate and the grill */
    const sufra = new THREE.Group();
    scene.add(sufra);

    const hammer = track(hammeredTexture());
    hammer.repeat.set(3, 3);
    const brass = track(
      new THREE.MeshPhysicalMaterial({ color: "#c79a44", metalness: 1, roughness: 0.34, bumpMap: hammer, bumpScale: 1.4, clearcoat: 0.3, clearcoatRoughness: 0.4, side: THREE.DoubleSide }),
    );
    const tray = new THREE.Mesh(track(trayGeometry()), brass);
    tray.position.y = 0; // underside at -0.05, clear of the cloth at -0.07 (no z-fighting)
    tray.receiveShadow = true; // the flat tray only receives: casting onto itself streaks the brass
    sufra.add(tray);

    const plateMat = track(
      new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide }),
    );
    const plate = new THREE.Mesh(track(plateGeometry()), plateMat);
    plate.position.y = 0.075;
    plateMat.shadowSide = THREE.FrontSide; // a double-sided plate shadowing its own underside streaks the tray
    plate.castShadow = plate.receiveShadow = true;
    sufra.add(plate);

    /* mezze bowls, served around the tray after the dish lands: hummus, muhammara, tabbouleh, olives, labneh */
    const BOWLS = [
      { glaze: "#2b8f9a", base: "#e2c99a", specks: ["#b4432e", "#c0582f", "#6d8f3a"], oil: true },
      { glaze: "#f1ece0", base: "#a73a24", specks: ["#d98c52", "#7a2316", "#e9c48a"], oil: true },
      { glaze: "#1e4a8c", base: "#6f9a3c", specks: ["#e9e1c4", "#c8372b", "#3f6b25", "#9fc35a"], oil: false },
      { glaze: "#c58b2c", base: "#4b4a26", specks: ["#2f2a17", "#6a6a32", "#3a2433"], oil: true },
      { glaze: "#5f7f3a", base: "#f2eee2", specks: ["#55702f", "#7a8f3f", "#a0532b"], oil: true },
    ];
    const bowlGeo = track(bowlGeometry());
    const fillGeo = track(new THREE.CircleGeometry(0.56, 48));
    const bowls = BOWLS.map((b, i) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        bowlGeo,
        track(new THREE.MeshPhysicalMaterial({ color: b.glaze, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide })),
      );
      body.castShadow = body.receiveShadow = true;
      const tex = track(mezzeTexture(b.base, b.specks, b.oil, 90 + i));
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      const fill = new THREE.Mesh(
        fillGeo,
        track(new THREE.MeshPhysicalMaterial({ map: tex, roughness: b.oil ? 0.32 : 0.6, clearcoat: b.oil ? 0.7 : 0.1, clearcoatRoughness: 0.2 })),
      );
      fill.rotation.x = -Math.PI / 2;
      fill.position.y = 0.2;
      fill.receiveShadow = true;
      g.add(body, fill);
      if (i === 3) {
        // olives: glossy ovals heaped in the bowl, green and purple
        const olive = new THREE.InstancedMesh(
          track(new THREE.SphereGeometry(0.09, 14, 10)),
          track(new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.22, clearcoat: 1 })),
          16,
        );
        const r2 = rng(13);
        const d = new THREE.Object3D();
        for (let k = 0; k < 16; k++) {
          const a = r2() * Math.PI * 2;
          const rr = Math.sqrt(r2()) * 0.38;
          d.position.set(Math.cos(a) * rr, 0.25 + r2() * 0.06, Math.sin(a) * rr);
          d.rotation.set(r2() * 3, r2() * 3, 0);
          d.scale.set(1, 0.78, 0.78);
          d.updateMatrix();
          olive.setMatrixAt(k, d.matrix);
          olive.setColorAt(k, new THREE.Color(k % 3 === 0 ? "#4a2a3a" : "#556126"));
        }
        olive.castShadow = true;
        g.add(olive);
      }
      // set in an arc on the cloth behind the tray, so the dish stays in front
      const a = Math.PI * (1.16 + i * 0.17);
      const home = new THREE.Vector3(Math.cos(a) * 3.3, -0.07, Math.sin(a) * 3.3);
      g.position.copy(home);
      g.visible = false;
      scene.add(g);
      return { g, home };
    });

    /* the mixed grill: bread first, then three skewers laid across it, then the garnish */
    const dish = new THREE.Group();
    dish.position.y = 0.075;
    sufra.add(dish);
    /** Each piece is laid in turn: it comes from `from` (relative to its place), tilted by `tilt`, and settles. */
    const layers: { obj: THREE.Object3D; base: THREE.Vector3; from: THREE.Vector3; tilt: number; at: number; grow: boolean }[] = [];
    const lay = (obj: THREE.Object3D, at: number, from: THREE.Vector3, tilt = 0, grow = false) => {
      layers.push({ obj, base: obj.position.clone(), from, tilt, at, grow });
      dish.add(obj);
    };
    const solid = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = m.receiveShadow = true;
      return m;
    };

    const bTex = track(breadTexture());
    const bread = solid(
      track(breadGeometry()),
      track(new THREE.MeshPhysicalMaterial({ map: bTex, bumpMap: bTex, bumpScale: 1.6, roughness: 0.82, sheen: 0.5, sheenColor: new THREE.Color("#ffe2b0"), sheenRoughness: 0.6 })),
    );
    lay(bread, 0, new THREE.Vector3(0, 2.6, 0));

    const steel = track(new THREE.MeshStandardMaterial({ color: "#cfd2d4", metalness: 1, roughness: 0.26 }));
    const bladeGeo = track(new THREE.BoxGeometry(3.3, 0.014, 0.05));
    const ringGeo = track(new THREE.TorusGeometry(0.11, 0.017, 10, 32));
    /** A flat steel skewer along x with a ring at the +x end; the food spans x = -0.95 to 0.95 at y = 0. */
    const skewer = () => {
      const g = new THREE.Group();
      const blade = solid(bladeGeo, steel);
      blade.position.x = 0.45;
      const ring = solid(ringGeo, steel);
      ring.position.set(2.21, 0, 0);
      ring.rotation.x = Math.PI / 2;
      g.add(blade, ring);
      return g;
    };
    const FOOD_Y = 0.2; // the food rests in the bread, a little below its full radius

    // 1. kofta
    const pTex = track(pattyTexture());
    pTex.repeat.set(1, 2);
    const kofta = skewer();
    kofta.add(
      solid(
        track(koftaGeometry()),
        track(new THREE.MeshPhysicalMaterial({ map: pTex, bumpMap: pTex, bumpScale: 2.2, vertexColors: true, color: new THREE.Color("#cf9f84"), roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.25, sheenColor: new THREE.Color("#ffb88a") })),
      ),
    );

    // 2. shish tawook
    const tTex = track(tawookTexture());
    const chickenMat = track(new THREE.MeshPhysicalMaterial({ map: tTex, bumpMap: tTex, bumpScale: 1.4, vertexColors: true, color: new THREE.Color("#ecb07a"), roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4 }));
    const chunkGeo = track(chunkGeometry());
    const tawook = skewer();
    const r1 = rng(5);
    for (let k = 0; k < 6; k++) {
      const c = solid(chunkGeo, chickenMat);
      c.position.set(-0.8 + k * 0.32, 0.01, (r1() - 0.5) * 0.03);
      c.rotation.set((r1() - 0.5) * 0.5, r1() * Math.PI, (r1() - 0.5) * 0.4);
      c.scale.setScalar(0.9 + r1() * 0.18);
      tawook.add(c);
    }

    // 3. grilled vegetables: tomato, onion, green pepper, in turn
    const veg = skewer();
    const tomatoGeo = track(tomatoGeometry());
    const tomatoMat = track(new THREE.MeshPhysicalMaterial({ color: "#c2311b", vertexColors: true, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.12 }));
    const onionGeos = [0.25, 0.21, 0.17].map((r) => track(shellGeometry(r, Math.PI * 0.9, 0.27)));
    const onionMats = ["#c999b4", "#ecdde3", "#f5ede4"].map((c) => track(new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.38, clearcoat: 0.5, side: THREE.DoubleSide })));
    const pepperGeo = track(shellGeometry(0.23, Math.PI * 0.78, 0.3));
    const pepperMat = track(new THREE.MeshPhysicalMaterial({ color: "#3c7a26", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }));
    for (let k = 0; k < 6; k++) {
      const x = -0.82 + k * 0.33;
      if (k % 3 === 0) {
        const tm = solid(tomatoGeo, tomatoMat);
        tm.position.set(x, 0, 0);
        tm.rotation.y = k;
        veg.add(tm);
      } else if (k % 3 === 1) {
        onionGeos.forEach((geo, j) => {
          const o = solid(geo, onionMats[j]);
          o.position.set(x, -0.1, 0);
          o.rotation.y = Math.PI / 2;
          veg.add(o);
        });
      } else {
        const p = solid(pepperGeo, pepperMat);
        p.position.set(x, -0.1, 0);
        p.rotation.y = Math.PI / 2 + 0.2;
        veg.add(p);
      }
    }

    // laid across the bread, the middle one the other way round so the rings fall on both sides
    [
      { obj: veg, z: -0.5, yaw: 0.16, flip: false },
      { obj: kofta, z: 0.02, yaw: -0.06, flip: true },
      { obj: tawook, z: 0.54, yaw: -0.2, flip: false },
    ].forEach(({ obj, z, yaw, flip }, i) => {
      obj.position.set(flip ? 0.12 : -0.12, FOOD_Y, z);
      obj.rotation.y = yaw + (flip ? Math.PI : 0);
      // each skewer comes in from above, from its ring's side, and is set down along its length
      const along = new THREE.Vector3(Math.cos(obj.rotation.y), 0, -Math.sin(obj.rotation.y)).multiplyScalar(1.6);
      lay(obj, 0.55 + i * 0.42, along.setY(2.2), 0.35);
    });

    // garnish: chopped parsley and sumac onion rings scattered over the bread's edge
    const r3 = rng(41);
    const parsley = new THREE.InstancedMesh(
      track(new THREE.IcosahedronGeometry(0.035, 0)),
      track(new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55 })),
      110,
    );
    const sumacRing = new THREE.InstancedMesh(
      track(new THREE.TorusGeometry(0.08, 0.01, 6, 24)),
      track(new THREE.MeshPhysicalMaterial({ color: "#8e2f4f", roughness: 0.35, clearcoat: 0.6 })),
      10,
    );
    const d = new THREE.Object3D();
    const greens = ["#3f7d2a", "#4f8f33", "#2f6420", "#5c9a3a"].map((c) => new THREE.Color(c));
    const rimLift = (rr: number) => Math.max(0, rr - 1.05) ** 2 * 0.42;
    for (let k = 0; k < parsley.count; k++) {
      const a = r3() * Math.PI * 2;
      const rr = 0.95 + r3() * 0.42;
      d.position.set(Math.cos(a) * rr, 0.06 + rimLift(rr), Math.sin(a) * rr);
      d.rotation.set(r3() * 3, r3() * 3, r3() * 3);
      d.scale.set(1 + r3(), 0.35, 0.7 + r3() * 0.6);
      d.updateMatrix();
      parsley.setMatrixAt(k, d.matrix);
      parsley.setColorAt(k, greens[k % greens.length]);
    }
    for (let k = 0; k < sumacRing.count; k++) {
      const a = (k / sumacRing.count) * Math.PI * 2 + r3() * 0.3;
      const rr = 1.05 + r3() * 0.25;
      d.position.set(Math.cos(a) * rr, 0.075 + rimLift(rr), Math.sin(a) * rr);
      d.rotation.set(Math.PI / 2 + (r3() - 0.5) * 0.4, (r3() - 0.5) * 0.4, 0);
      d.scale.setScalar(0.7 + r3() * 0.6);
      d.updateMatrix();
      sumacRing.setMatrixAt(k, d.matrix);
    }
    parsley.castShadow = sumacRing.castShadow = true;
    const garnish = new THREE.Group();
    garnish.add(parsley, sumacRing);
    lay(garnish, 1.95, new THREE.Vector3(0, 0.4, 0), 0, true);

    const loadedAt = 0.3;
    const clock = new THREE.Clock();


    /* the mezze names: each appears above its bowl for a moment as it is served */
    const mezzeEls = mezzeKey
      ? mezzeKey.split("|").map((text) => {
          const el = document.createElement("div");
          el.textContent = text;
          el.style.cssText =
            "position:absolute;left:0;top:0;opacity:0;pointer-events:none;white-space:nowrap;font:500 12px/1 var(--font-display,system-ui);color:#1f3a2a;background:#f4f7ee;border-radius:999px;padding:5px 10px;box-shadow:0 4px 14px -6px rgba(10,24,14,.6);will-change:transform,opacity";
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
      sufra.rotation.y = angle;

      /* timeline: the bread lands, each skewer is laid on it in turn, then the garnish is scattered */
      const sinceLoad = t - loadedAt;
      const laying = !reducedMotion && frozen === null && sinceLoad < T_DROP;
      layers.forEach((l) => {
        const k = laying ? easeOut(clamp01((sinceLoad - l.at) / 0.8)) : 1;
        l.obj.visible = k > 0.001;
        l.obj.position.copy(l.base).addScaledVector(l.from, 1 - k);
        l.obj.rotation.z = l.tilt * (1 - k);
        if (l.grow) l.obj.scale.setScalar(0.4 + 0.6 * k);
      });

      /* camera: low, long lens; slow dolly-in on load, gentle parallax */
      const intro = reducedMotion ? 1 : ease(clamp01(t / 2.4));
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      const aspect = w / h;
      const dist = Math.max(14.5, 15.5 / Math.min(1, aspect * 1.05)) * (1.12 - 0.12 * intro);
      camX += ((reducedMotion ? 0 : px) * 0.8 - camX) * Math.min(1, dt * 2.4);
      camY += (-(reducedMotion ? 0 : py) * 0.4 - camY) * Math.min(1, dt * 2.4);
      camera.position.set(camX, dist * 0.62 + camY, dist * 0.82);
      camera.lookAt(0, 0.2, aspect > 1.2 ? -0.9 : 1.5);
      camera.updateMatrixWorld();

      /* the bowls are served one by one after the dish lands: each slides in from the cloth's edge and settles */
      const served = (sinceLoad - T_DROP - 0.2 + T_SERVICE) % T_SERVICE;
      bowls.forEach((b, i) => {
        // served in turn, left on the table, then cleared in turn before the next service
        let k: number;
        if (reducedMotion || frozen !== null) k = 1; // a still table: every bowl in place
        else if (sinceLoad < T_DROP) k = 0; // the dish lands first
        else k = easeOut(clamp01((served - i * 0.32) / 0.7)) * (1 - ease(clamp01((served - (T_SERVICE - 2.4) - i * 0.18) / 0.6)));
        b.g.visible = k > 0.001;
        b.g.position.set(b.home.x * (1 + (1 - k) * 0.6), b.home.y + (1 - k) * 0.5, b.home.z * (1 + (1 - k) * 0.6));
        b.g.scale.setScalar(0.75 + 0.3 * k);
        const lab = mezzeEls[i];
        if (!lab) return;
        tmp.copy(b.g.position).setY(0.8).project(camera);
        const lx = (tmp.x * 0.5 + 0.5) * w;
        const ly = (-tmp.y * 0.5 + 0.5) * h;
        const local = served - i * 0.32;
        const show = reducedMotion || frames < 4 ? 0 : clamp01((local - 0.5) / 0.3) * clamp01((3.2 - local) / 0.5);
        lab.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -100%)`;
        lab.style.opacity = Number.isFinite(lx) && Number.isFinite(ly) ? String(show) : "0";
      });

      camera.updateMatrixWorld();
      frames++;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
        cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      mezzeEls.forEach((l) => l.remove());
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      el.remove();
    };
  }, [reducedMotion, mezzeKey]);

  return <div ref={hostRef} className="relative size-full overflow-hidden" role="img" aria-label={ariaLabel} />;
}
