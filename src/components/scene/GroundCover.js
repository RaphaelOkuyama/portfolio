'use client';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, IcosahedronGeometry, Matrix4, Quaternion, Vector3, Euler } from 'three';
import { useJourney } from '../../store/journey';
import { mulberry32 } from '../../lib/journey/ridge';
import { groundHeight } from '../../lib/journey/ground';
import { useAccentMaterials } from './useAccentMaterials';
import { assemble, paint, shadeOnto } from './lowpoly';
import { pathDistanceAt } from './pathMap';
import { GARDEN, GROUND, SANDO } from './config';

// 下草: capim e pedras soltas na beira do caminho. O chão era uma superfície lisa de ponta a ponta;
// com eles a beira das lajes ganha escala e o caminho parece pisado, não desenhado em cima
const COUNT = {
  grass: { high: 900, medium: 560, low: 280 },
  rocks: { high: 80, medium: 56, low: 32 },
};

// Tufo: lâminas finas que saem do mesmo ponto e vergam para fora, mais escuras no pé
let tuftCache = null;
function tuftGeometry() {
  if (tuftCache) return tuftCache;
  const rand = mulberry32(419);
  const blades = 12;
  const positions = [];
  const colors = [];
  for (let b = 0; b < blades; b += 1) {
    const angle = (b / blades) * Math.PI * 2 + rand() * 0.6;
    const height = 0.22 + rand() * 0.34;
    const lean = 0.12 + rand() * 0.3;
    const half = 0.022 + rand() * 0.012;
    const [dx, dz] = [Math.cos(angle), Math.sin(angle)];
    // Lado da lâmina: perpendicular à direção em que ela verga
    const [sx, sz] = [-dz * half, dx * half];
    const at = (t, side) => [dx * (0.03 + lean * t * t) + sx * side * (1 - t * 0.7), height * t, dz * (0.03 + lean * t * t) + sz * side * (1 - t * 0.7)];
    const tone = 0.85 + rand() * 0.3;
    const quad = [[0, -1], [0, 1], [0.55, 1], [0, -1], [0.55, 1], [0.55, -1], [0.55, -1], [0.55, 1], [1, 0]];
    quad.forEach(([t, side]) => {
      positions.push(...at(t, side));
      const shade = (0.5 + 0.7 * t) * tone;
      colors.push(shade, shade * 1.04, shade * 0.9);
    });
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  tuftCache = shadeOnto(geometry);
  // Todas as lâminas com a mesma normal, virada para quem desce o caminho (+z): assim a luz da cena
  // dá ao capim a poça das lanternas mas não o contorno do luar, que em lâminas finas (e com a
  // normal de cada face) acendia o tufo inteiro de branco. Por isso os tufos não giram em y
  const normals = tuftCache.attributes.normal;
  for (let i = 0; i < normals.count; i += 1) normals.setXYZ(i, 0, 0.24, 0.97);
  return tuftCache;
}

// Pedra solta: icosaedro amassado, cada vértice um pouco fora do lugar
let rockCache = null;
function rockGeometry() {
  if (rockCache) return rockCache;
  const rand = mulberry32(523);
  const geometry = new IcosahedronGeometry(0.3, 0);
  const pos = geometry.attributes.position;
  const moved = new Map();
  for (let i = 0; i < pos.count; i += 1) {
    // Os vértices repetidos (um por face) andam juntos, senão a pedra abre nas arestas
    const key = [pos.getX(i), pos.getY(i), pos.getZ(i)].map((v) => v.toFixed(3)).join(',');
    if (!moved.has(key)) moved.set(key, 0.78 + rand() * 0.44);
    const s = moved.get(key);
    pos.setXYZ(i, pos.getX(i) * s, Math.max(-0.08, pos.getY(i) * s * 0.62), pos.getZ(i) * s);
  }
  rockCache = assemble([paint(geometry, [0.86, 0.85, 0.82])]);
  return rockCache;
}

// Dentro da água não nasce nada: depois da margem (z = -50) o rio corre entre |x| ≈ 14
const inWater = (x, z) => z < -50 && Math.abs(x) < 15.5;

function scatter(count, { seed, near, far, clearing }) {
  const rand = mulberry32(seed);
  const curves = [SANDO.points, SANDO.farPoints].map((points) => new CatmullRomCurve3(points.map(([x, z]) => new Vector3(x, 0, z)), false, 'centripetal'));
  const share = curves[0].getLength() / (curves[0].getLength() + curves[1].getLength());
  const tangent = new Vector3();
  const spots = [];
  const [gw, gd] = GARDEN.size;
  for (let tries = 0; spots.length < count && tries < count * 12; tries += 1) {
    const curve = rand() < share ? curves[0] : curves[1];
    const t = rand();
    const p = curve.getPointAt(t);
    curve.getTangentAt(t, tangent);
    const side = rand() < 0.5 ? -1 : 1;
    // Mais denso junto das lajes, rareando para fora
    const offset = near + (far - near) * rand() ** 1.8;
    const x = p.x + tangent.z * side * offset;
    const z = p.z - tangent.x * side * offset;
    if (pathDistanceAt(x, z) < near - 0.1 || inWater(x, z)) continue;
    if (clearing && Math.abs(x) < gw / 2 && Math.abs(z - GARDEN.z) < gd / 2) continue;
    spots.push({ x, y: groundHeight(x, z, GROUND), z, turn: rand() * Math.PI * 2, size: rand(), tilt: (rand() - 0.5) * 0.3 });
  }
  return spots;
}

const matrix = new Matrix4();
const position = new Vector3();
const rotation = new Quaternion();
const euler = new Euler();
const scale = new Vector3();

export default function GroundCover() {
  const quality = useJourney((s) => s.quality);
  const materials = useAccentMaterials({ grass: { accent: 'bambooLeaf', double: true }, rock: { accent: 'granite' } });
  const grassRef = useRef(null);
  const rockRef = useRef(null);
  const { grass, rocks } = useMemo(() => ({
    grass: scatter(COUNT.grass[quality] ?? COUNT.grass.low, { seed: 617, near: 1.45, far: 6.2 }),
    rocks: scatter(COUNT.rocks[quality] ?? COUNT.rocks.low, { seed: 733, near: 1.6, far: 4.4, clearing: true }),
  }), [quality]);

  useEffect(() => {
    const place = (mesh, spots, sizeOf, sink, turns) => {
      if (!mesh) return;
      spots.forEach((s, i) => {
        const k = sizeOf(s.size);
        position.set(s.x, s.y - sink * k, s.z);
        rotation.setFromEuler(euler.set(s.tilt, turns ? s.turn : 0, s.tilt * 0.6));
        // Sem giro, o capim varia espelhando em x (metade dos tufos) e na altura
        const mirror = !turns && s.turn > Math.PI ? -1 : 1;
        mesh.setMatrixAt(i, matrix.compose(position, rotation, scale.set(k * mirror, k * (0.85 + s.size * 0.4), k)));
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(grassRef.current, grass, (r) => 0.6 + r * 0.75, 0.02, false);
    place(rockRef.current, rocks, (r) => 0.5 + r * r * 1.5, 0.05, true);
  }, [grass, rocks]);

  return (
    <>
      <instancedMesh key={`g${grass.length}`} ref={grassRef} args={[tuftGeometry(), materials.grass, grass.length]} frustumCulled={false} />
      <instancedMesh key={`r${rocks.length}`} ref={rockRef} args={[rockGeometry(), materials.rock, rocks.length]} frustumCulled={false} />
    </>
  );
}
