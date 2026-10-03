import {
  BoxGeometry, BufferAttribute, CatmullRomCurve3, IcosahedronGeometry, PlaneGeometry, TubeGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bakeShade } from './toriiGeometry';
import { hex, paint, shadeOnto } from './lowpoly';

// 磐座 (iwakura): a rocha sagrada amarrada com 注連縄 (shimenawa), com os papéis 紙垂 (shide) e
// os tufos de palha (房) pendurados na frente. Mesma linguagem do torii: low-poly, tom de luz
// pintado nos vértices e cor da paleta no material. Unidades: raio da rocha ~1, base em y = 0

// Altura e raio da rocha em cada direção: ondulações suaves (continuas, para os vértices
// repetidos das faces baterem) e base achatada, assentada no chão
// Pedra em pé (mais alta que larga), com o topo um pouco inclinado e facetas marcadas
const SCALE = new Vector3(1.05, 1.45, 0.95);
const FLAT_Y = -0.72;

function radiusAt(dir) {
  const { x, y, z } = dir;
  return 1
    + 0.16 * Math.sin(3.1 * x + 1.7) * Math.cos(2.3 * z + 0.4)
    + 0.1 * Math.sin(4.7 * y + 2.2 * x + 0.9)
    + 0.07 * Math.cos(6.3 * z - 3.1 * y + 2.1)
    // Ombro mais alto de um lado: o topo inclina, como pedra que rolou e assentou
    + 0.12 * Math.max(0, y) * x
    // Lombadas grandes e irregulares: pedra de verdade, não um ovo
    + 0.13 * Math.sin(1.9 * x + 2.6 * z + 0.7) * Math.cos(1.3 * y - 0.5)
    // Corpo largo embaixo, que vai afinando até um topo arredondado
    - 0.2 * Math.max(0, y) ** 1.4
    + 0.1 * Math.max(0, -y);
}

// O topo pende para um lado (a pedra assentou torta)
const LEAN = 0.16;

function surfacePoint(dir) {
  const p = dir.clone().multiplyScalar(radiusAt(dir));
  if (p.y < FLAT_Y) p.y = FLAT_Y + (p.y - FLAT_Y) * 0.12;
  p.x += LEAN * Math.max(0, p.y);
  return p.multiply(SCALE);
}

function rockGeometry() {
  // Pouca subdivisão: facetas grandes, como o torii e as montanhas
  const g = new IcosahedronGeometry(1, 2);
  const pos = g.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).normalize();
    const p = surfacePoint(v);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  // Base no chão: o ponto mais baixo vira y = 0 (a corda e os papéis sobem o mesmo tanto)
  g.computeBoundingBox();
  const lift = -g.boundingBox.min.y;
  g.translate(0, lift, 0);
  // Pedrinhas em volta da base quebram a linha reta onde a pedra encontra o chão
  const pebbles = PEBBLES.map(([x, z, size, turn]) => {
    const pebble = new IcosahedronGeometry(1, 0);
    pebble.scale(size * 1.3, size * 0.75, size);
    pebble.rotateY(turn);
    // Acima do quanto a pedra afunda no chão (IWAKURA.sink), senão somem
    pebble.translate(x, size * 0.35 + 0.26, z);
    return pebble;
  });
  return { geometry: bakeShade(mergeGeometries([g, ...pebbles])), lift };
}

// [x, z, tamanho, giro] das pedrinhas, em volta da frente e dos lados
const PEBBLES = [
  [-1.2, 0.75, 0.24, 0.4],
  [-0.85, 1.12, 0.14, 1.2],
  [1.15, 0.9, 0.2, 2.1],
  [1.45, 0.3, 0.12, 0.8],
];

const STRAW = hex('#d9bb7c');
const STRAW_DARK = hex('#9a7740');
const PAPER = hex('#fbf8f0');

// A corda amarra o terço de cima, como nas pedras sagradas: embaixo dela, o corpo da pedra
// se abre até o chão. Leve inclinação, acompanhando o ombro
const ROPE_HEIGHT = 0.42;
const ROPE_RADIUS = 0.07;
const ROPE_SEGMENTS = 180;

function ropePoint(theta, lift) {
  // Superfície da rocha naquela direção, levantada até a altura da corda
  const dir = new Vector3(Math.cos(theta), ROPE_HEIGHT / SCALE.y, Math.sin(theta)).normalize();
  const p = surfacePoint(dir);
  // Rente à pedra: a corda aperta a cintura, o tubo encosta na superfície
  const out = new Vector3(p.x, 0, p.z).multiplyScalar(0.99);
  return new Vector3(out.x, lift + ROPE_HEIGHT + 0.05 * Math.sin(theta) + 0.03 * Math.cos(2 * theta), out.z);
}

function ropeGeometry(lift) {
  const points = Array.from({ length: 48 }, (_, i) => ropePoint((i / 48) * Math.PI * 2, lift));
  const curve = new CatmullRomCurve3(points, true, 'centripetal');
  const radial = 8;
  const g = new TubeGeometry(curve, ROPE_SEGMENTS, ROPE_RADIUS, radial, true);
  // Trança: listras diagonais de palha clara e escura correndo em volta da corda
  const colors = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i <= ROPE_SEGMENTS; i += 1) {
    for (let j = 0; j <= radial; j += 1) {
      const band = Math.floor((i * 0.9 + j * 1.6) / 3) % 2;
      colors.set(band ? STRAW : STRAW_DARK, (i * (radial + 1) + j) * 3);
    }
  }
  g.setAttribute('color', new BufferAttribute(colors, 3));
  return { geometry: shadeOnto(g), curve };
}

// Ponto da corda mais perto de um ângulo (para pendurar papel e palha)
function onRope(curve, theta) {
  const target = new Vector3(Math.cos(theta), 0, Math.sin(theta));
  let best = 0;
  let bestDot = -Infinity;
  for (let k = 0; k < 360; k += 1) {
    const p = curve.getPointAt(k / 360);
    const d = new Vector3(p.x, 0, p.z).normalize().dot(target);
    if (d > bestDot) {
      bestDot = d;
      best = k / 360;
    }
  }
  return curve.getPointAt(best);
}

// Um 紙垂: tira de papel dobrada em quatro degraus, cada um deslocado para o lado
function shide() {
  const w = 0.1;
  const h = 0.13;
  const steps = [0, 0.75, 0, 0.75].map((dx, i) => {
    const piece = new PlaneGeometry(w, h);
    piece.translate(dx * w, -h / 2 - i * h * 0.96, 0);
    return piece;
  });
  return paint(mergeGeometries(steps), PAPER);
}

// Um tufo de palha: três fios finos de comprimentos diferentes
function fusa() {
  const strands = [-0.02, 0, 0.02].map((dx, i) => {
    const length = 0.26 + (i % 2) * 0.05;
    const strand = new BoxGeometry(0.016, length, 0.016);
    strand.translate(dx, -length / 2, 0);
    return strand;
  });
  return shadeOnto(paint(mergeGeometries(strands), STRAW));
}

// Pendura uma peça na corda, de frente para fora da rocha
function hangAt(piece, curve, theta, outward) {
  const p = onRope(curve, theta);
  const normal = new Vector3(p.x, 0, p.z).normalize();
  const g = piece.clone();
  g.rotateY(Math.atan2(normal.x, normal.z));
  g.translate(p.x + normal.x * outward, p.y - ROPE_RADIUS * 0.6, p.z + normal.z * outward);
  return g;
}

let cache = null;

// Peças do iwakura (geometrias em cache, compartilhadas). A frente fica no +z (ângulo 90°)
export function iwakuraGeometry() {
  if (cache) return cache;
  const { geometry: rock, lift } = rockGeometry();
  const { geometry: rope, curve } = ropeGeometry(lift);
  const front = Math.PI / 2;
  const shideAt = [front - 0.62, front, front + 0.62];
  const fusaAt = [front - 0.95, front - 0.31, front + 0.31, front + 0.95];
  cache = {
    rock,
    rope,
    paper: mergeGeometries(shideAt.map((t) => hangAt(shide(), curve, t, ROPE_RADIUS * 1.1))),
    straw: mergeGeometries(fusaAt.map((t) => hangAt(fusa(), curve, t, ROPE_RADIUS * 0.9))),
  };
  return cache;
}
