import { BufferAttribute, LatheGeometry, Shape, ShapeGeometry, SphereGeometry, Vector2 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// 鯉: carpa com comprimento 1 ao longo de z (cabeça em +z, cauda em -z), dorso em +y. Corpo liso
// (normais suavizadas, o sombreado é feito no shader) e nadadeiras finas. O atributo aPart marca a
// parte: 0 corpo, 1 nadadeira (translúcida, mais clara), 2 olho. As manchas são pintadas no shader
// (Koi.js), não na geometria. Em cache: uma só para todas as carpas

let cache = null;

function withPart(geometry, part) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute('uv');
  g.setAttribute('aPart', new BufferAttribute(new Float32Array(g.attributes.position.count).fill(part), 1));
  return g;
}

// Nadadeira plana desenhada em XY a partir de curvas, deitada no plano da água (y → -z)
function finShape(draw, segments = 12) {
  const shape = new Shape();
  draw(shape);
  const g = new ShapeGeometry(shape, segments);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

export function koiGeometry() {
  if (cache) return cache;

  // Corpo: perfil da cauda (t = 0) ao focinho (t = 1). Ombro largo a ~60%, pedúnculo fino
  const profile = [];
  const steps = 22;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const body = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.68)), 0.72);
    const r = Math.max(0.028, 0.15 * body) * (i === steps ? 0 : 1);
    profile.push(new Vector2(r, t - 0.5));
  }
  const body = new LatheGeometry(profile, 16);
  body.rotateX(Math.PI / 2);
  // Achatado, com a barriga um pouco mais reta que o dorso
  body.scale(1, 0.68, 1);
  body.computeVertexNormals();

  // Cauda longa em dois lobos (a da koi "borboleta"), presa no fim do pedúnculo
  const tail = finShape((s) => {
    s.moveTo(0, 0.02);
    s.quadraticCurveTo(-0.12, -0.08, -0.22, -0.3);
    s.quadraticCurveTo(-0.1, -0.24, 0, -0.16);
    s.quadraticCurveTo(0.1, -0.24, 0.22, -0.3);
    s.quadraticCurveTo(0.12, -0.08, 0, 0.02);
  });
  tail.translate(0, 0, -0.47);

  // Peitorais em leque, abertas para os lados logo atrás da cabeça
  const pectoral = (side) => {
    const g = finShape((s) => {
      s.moveTo(0, 0);
      s.quadraticCurveTo(side * 0.2, 0.02, side * 0.22, -0.12);
      s.quadraticCurveTo(side * 0.1, -0.1, 0, -0.06);
      s.quadraticCurveTo(side * 0.02, -0.02, 0, 0);
    });
    g.translate(side * 0.1, -0.03, 0.2);
    return g;
  };

  // Dorsal: uma vela baixa em pé ao longo do dorso
  const dorsal = (() => {
    const shape = new Shape();
    shape.moveTo(-0.22, 0);
    shape.quadraticCurveTo(-0.05, 0.09, 0.14, 0.04);
    shape.lineTo(0.16, 0);
    shape.lineTo(-0.22, 0);
    const g = new ShapeGeometry(shape, 8);
    g.rotateY(Math.PI / 2);
    g.translate(0, 0.095, -0.02);
    g.computeVertexNormals();
    return g;
  })();

  const eye = (side) => {
    const g = new SphereGeometry(0.018, 6, 5);
    g.translate(side * 0.075, 0.035, 0.38);
    return g;
  };

  cache = mergeGeometries([
    withPart(body, 0),
    withPart(tail, 1),
    withPart(pectoral(1), 1),
    withPart(pectoral(-1), 1),
    withPart(dorsal, 1),
    withPart(eye(1), 2),
    withPart(eye(-1), 2),
  ]);
  return cache;
}
