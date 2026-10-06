import { BufferAttribute, BufferGeometry, CylinderGeometry, LatheGeometry, SphereGeometry, Vector2, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// 鯉: carpa com comprimento 1 ao longo de z (cabeça em +z, cauda em -z), dorso em +y. Corpo liso
// (normais suavizadas, o sombreado é feito no shader) e nadadeiras finas e longas, como as da koi
// "borboleta". Atributos:
//   aPart: 0 corpo, 1 nadadeira (1.25 nas peitorais), 2 olho, 3 barbilhão
//   aFin:  nas nadadeiras (da base à ponta 0..1, ao redor 0..1: os raios); no olho, a distância
//          ao centro da pupila (0..1)
// As manchas são pintadas no shader (Koi.js), não na geometria. Em cache: uma só para todas

let cache = null;

// Raio do corpo (antes de achatar) na posição z: o mesmo perfil do torno
const FLAT = 0.68;
// Do pedúnculo ao ombro segue um seno; da nuca em diante a cabeça fecha numa elipse (focinho
// arredondado, não em ponta)
const NAPE = 0.72;
const trunk = (t) => 0.162 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.68)), 0.72);
function radiusAt(z) {
  const t = Math.min(Math.max(z + 0.5, 0), 1);
  if (t <= NAPE) return Math.max(0.028, trunk(t));
  const u = (t - NAPE) / (1 - NAPE);
  return trunk(NAPE) * Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.12 * u);
}

function tag(geometry, part, fin) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g.attributes.uv) g.deleteAttribute('uv');
  const n = g.attributes.position.count;
  g.setAttribute('aPart', new BufferAttribute(new Float32Array(n).fill(part), 1));
  g.setAttribute('aFin', fin ?? new BufferAttribute(new Float32Array(n * 2), 2));
  return g;
}

// Nadadeira em grade: para cada s (ao redor, 0..1) vai da base(s) até a ponta(s); `sag` curva a
// membrana. Com vértices por dentro, a transparência e a ondulação ficam suaves até a ponta
function fin(base, tip, { ns = 14, nr = 6, sag = () => new Vector3() } = {}) {
  const pos = [];
  const attr = [];
  for (let i = 0; i <= ns; i += 1) {
    const s = i / ns;
    const a = base(s);
    const b = tip(s);
    for (let j = 0; j <= nr; j += 1) {
      const r = j / nr;
      const p = new Vector3().lerpVectors(a, b, r).add(sag(s, r));
      pos.push(p.x, p.y, p.z);
      attr.push(r, s);
    }
  }
  const index = [];
  const row = nr + 1;
  for (let i = 0; i < ns; i += 1) {
    for (let j = 0; j < nr; j += 1) {
      const a = i * row + j;
      index.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aFinRaw', new BufferAttribute(new Float32Array(attr), 2));
  g.setIndex(index);
  g.computeVertexNormals();
  const flat = g.toNonIndexed();
  const raw = flat.attributes.aFinRaw;
  flat.deleteAttribute('aFinRaw');
  return { geometry: flat, attr: raw };
}

function finPart(f, part) {
  return tag(f.geometry, part, f.attr);
}

// Tubo fino entre dois pontos (barbilhões)
function strand(a, b, radius) {
  const dir = new Vector3().subVectors(b, a);
  const g = new CylinderGeometry(radius * 0.4, radius, dir.length(), 4, 1, true);
  // O cilindro nasce em pé (+y): deita em +z e então aponta +z para o fim do fio
  g.translate(0, dir.length() / 2, 0);
  g.rotateX(Math.PI / 2);
  g.lookAt(dir);
  g.translate(a.x, a.y, a.z);
  return g;
}

export function koiGeometry() {
  if (cache) return cache;

  // Corpo: perfil da cauda (t = 0) ao focinho (t = 1). Ombro largo a ~60%, pedúnculo fino
  const profile = [];
  // Mais anéis perto do focinho, onde a curva fecha
  const steps = 30;
  for (let i = 0; i <= steps; i += 1) {
    const t = 1 - Math.pow(1 - i / steps, 1.35);
    profile.push(new Vector2(i === steps ? 0 : radiusAt(t - 0.5), t - 0.5));
  }
  const body = new LatheGeometry(profile, 20);
  body.rotateX(Math.PI / 2);
  body.scale(1, FLAT, 1);
  body.computeVertexNormals();

  // Cauda longa em dois lobos, presa no pedúnculo; o meio é mais curto (o garfo)
  const tail = fin(
    (s) => new Vector3((s * 2 - 1) * 0.035, 0, -0.45),
    (s) => {
      const k = s * 2 - 1;
      const len = 0.24 + 0.2 * Math.pow(Math.abs(k), 0.7);
      return new Vector3(k * 0.27, 0, -0.45 - len);
    },
    { ns: 16, nr: 7, sag: (s, r) => new Vector3(0, -0.015 * Math.sin(Math.PI * r), 0) },
  );

  // Peitorais grandes em leque, logo atrás da cabeça, abertas para os lados e para trás
  const pectoral = (side) => fin(
    (s) => new Vector3(side * 0.095, -0.035, 0.25 - s * 0.06),
    (s) => {
      const a = 0.25 + s * 1.05;
      const len = 0.24 * (0.62 + 0.38 * Math.sin(Math.PI * Math.pow(s, 0.8)));
      return new Vector3(side * (0.095 + Math.cos(a) * len), -0.06, 0.25 - s * 0.06 - Math.sin(a) * len);
    },
    { ns: 10, nr: 6, sag: (s, r) => new Vector3(0, -0.02 * r * r, 0) },
  );

  // Pélvicas: pequenas, embaixo, no meio do corpo
  const pelvic = (side) => fin(
    (s) => new Vector3(side * 0.05, -0.07, 0.02 - s * 0.05),
    (s) => {
      const a = 0.6 + s * 0.8;
      const len = 0.1 * (0.6 + 0.4 * Math.sin(Math.PI * s));
      return new Vector3(side * (0.05 + Math.cos(a) * len), -0.09, 0.02 - s * 0.05 - Math.sin(a) * len);
    },
    { ns: 6, nr: 4 },
  );

  // Dorsal: vela longa em pé ao longo do dorso, mais alta na frente
  const dorsal = fin(
    (s) => {
      const z = 0.16 - s * 0.44;
      return new Vector3(0, radiusAt(z) * FLAT - 0.006, z);
    },
    (s) => {
      const z = 0.16 - s * 0.44;
      const h = 0.085 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + s * 0.95)), 0.6) * (1 - s * 0.35);
      return new Vector3(0, radiusAt(z) * FLAT + h, z - 0.05 * h / 0.085);
    },
    { ns: 14, nr: 5 },
  );

  // Olhos: na superfície da cabeça, um pouco acima da linha do meio, achatados contra o corpo.
  // aFin.x = distância ao centro da pupila (0 no centro, 1 na borda do globo)
  const eye = (side) => {
    const z = 0.37;
    const r = radiusAt(z);
    const phi = 0.42;
    const surface = new Vector3(side * r * Math.cos(phi), FLAT * r * Math.sin(phi), z);
    const normal = new Vector3(side * Math.cos(phi), Math.sin(phi) / FLAT, 0).normalize();
    // Globo raso: achatado na direção da normal (lookAt alinha +z com a normal)
    const g = new SphereGeometry(0.016, 14, 10).toNonIndexed();
    g.scale(1, 1, 0.45);
    g.lookAt(normal);
    const n = g.attributes.position.count;
    const attr = new Float32Array(n * 2);
    const v = new Vector3();
    for (let i = 0; i < n; i += 1) {
      v.fromBufferAttribute(g.attributes.position, i).normalize();
      attr[i * 2] = Math.acos(Math.min(1, Math.max(-1, v.dot(normal)))) / (Math.PI / 2);
    }
    g.translate(surface.x - normal.x * 0.004, surface.y - normal.y * 0.004, surface.z);
    return tag(g, 2, new BufferAttribute(attr, 2));
  };

  // Barbilhões: dois pares curtos no canto da boca
  const barbels = [1, -1].flatMap((side) => [
    strand(new Vector3(side * 0.02, -0.025, 0.48), new Vector3(side * 0.045, -0.05, 0.445), 0.0028),
    strand(new Vector3(side * 0.03, -0.02, 0.465), new Vector3(side * 0.058, -0.045, 0.42), 0.0022),
  ]);

  cache = mergeGeometries([
    tag(body, 0),
    finPart(tail, 1),
    finPart(pectoral(1), 1.25),
    finPart(pectoral(-1), 1.25),
    finPart(pelvic(1), 1.25),
    finPart(pelvic(-1), 1.25),
    finPart(dorsal, 1),
    eye(1),
    eye(-1),
    ...barbels.map((g) => tag(g, 3)),
  ]);
  return cache;
}
