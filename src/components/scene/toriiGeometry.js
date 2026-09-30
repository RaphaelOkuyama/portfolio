import {
  BufferAttribute, CylinderGeometry, ExtrudeGeometry, Shape, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Luz "pintada" nos vértices: a cena usa MeshBasicMaterial (cores da paleta, sem luzes),
// então o relevo low-poly vem de um tom por face multiplicado pela cor do material
const LIGHT = new Vector3(-0.45, 0.8, 0.55).normalize();
const MIN_SHADE = 0.68;

function bakeShade(geometry) {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  flat.computeVertexNormals();
  const normals = flat.attributes.normal;
  const colors = new Float32Array(normals.count * 3);
  const n = new Vector3();
  for (let i = 0; i < normals.count; i++) {
    n.fromBufferAttribute(normals, i);
    const shade = MIN_SHADE + (1 - MIN_SHADE) * Math.max(0, n.dot(LIGHT));
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  flat.setAttribute('color', new BufferAttribute(colors, 3));
  return flat;
}

const BEVEL = { bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 };

// Caixa com cantos chanfrados, centrada na origem
function bevelBox(width, height, depth) {
  const b = BEVEL.bevelSize;
  const shape = new Shape();
  const w = width / 2 - b;
  const h = height / 2 - b;
  shape.moveTo(-w, -h);
  shape.lineTo(w, -h);
  shape.lineTo(w, h);
  shape.lineTo(-w, h);
  shape.closePath();
  const g = new ExtrudeGeometry(shape, { ...BEVEL, depth: depth - BEVEL.bevelThickness * 2, curveSegments: 1 });
  g.translate(0, 0, -(depth - BEVEL.bevelThickness * 2) / 2);
  return g;
}

// Viga superior com "sori": base arqueada e pontas levantadas, vista de frente
function curvedBeam(width, thickness, depth, lift) {
  const half = width / 2;
  const shape = new Shape();
  shape.moveTo(-half, lift);
  shape.quadraticCurveTo(0, -lift * 0.35, half, lift);
  shape.lineTo(half + 0.18, lift + thickness + 0.08);
  shape.quadraticCurveTo(0, thickness - lift * 0.2, -half - 0.18, lift + thickness + 0.08);
  shape.closePath();
  const g = new ExtrudeGeometry(shape, { ...BEVEL, depth: depth - BEVEL.bevelThickness * 2, curveSegments: 10 });
  g.translate(0, 0, -(depth - BEVEL.bevelThickness * 2) / 2);
  return g;
}

function placed(geometry, x, y, z = 0) {
  geometry.translate(x, y, z);
  return geometry;
}

const cache = new Map();

// Geometrias de um portão (corpo vermelho + partes escuras), unidas por material.
// Cacheadas por spec: todos os portões iguais (ex.: senbon) compartilham os mesmos buffers.
export function toriiGeometry(spec) {
  if (cache.has(spec)) return cache.get(spec);
  const { pillarHeight, pillarRadius, span, kasagiY, nukiY } = spec;
  const half = span / 2;
  const segments = 12;

  const body = [];
  const dark = [];

  // Pilares (hashira): levemente afunilados; base escura (nemaki)
  for (const x of [-half, half]) {
    body.push(placed(new CylinderGeometry(pillarRadius * 0.88, pillarRadius, pillarHeight, segments), x, pillarHeight / 2));
    dark.push(placed(new CylinderGeometry(pillarRadius * 1.22, pillarRadius * 1.3, pillarHeight * 0.06, segments), x, pillarHeight * 0.03));
  }

  // Nuki: viga de baixo que atravessa os pilares e sobra dos lados
  const nukiH = pillarRadius * 0.95;
  body.push(placed(bevelBox(span + pillarRadius * 3.2, nukiH, pillarRadius * 1.05), 0, nukiY));

  // Gakuzuka: montante central entre nuki e shimaki
  const shimakiY = kasagiY - pillarRadius * 1.3;
  body.push(placed(bevelBox(pillarRadius * 1.1, shimakiY - nukiY - nukiH * 0.5, pillarRadius * 0.85), 0, (shimakiY + nukiY) / 2));

  // Shimaki (vermelho) e kasagi (topo escuro), ambos com as pontas curvadas
  const lift = pillarRadius * 1.1;
  body.push(placed(curvedBeam(span + pillarRadius * 5, pillarRadius * 0.9, pillarRadius * 1.7, lift * 0.55), 0, shimakiY - pillarRadius * 0.45));
  dark.push(placed(curvedBeam(span + pillarRadius * 7, pillarRadius * 1.3, pillarRadius * 2, lift), 0, kasagiY - pillarRadius * 0.55));

  const result = {
    body: bakeShade(mergeGeometries(body.map((g) => g.toNonIndexed()))),
    dark: bakeShade(mergeGeometries(dark.map((g) => g.toNonIndexed()))),
  };
  body.concat(dark).forEach((g) => g.dispose());
  cache.set(spec, result);
  return result;
}
