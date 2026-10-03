import { BufferAttribute, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Utilitários das peças low-poly da cena (torii, iwakura, santuário): a cena usa
// MeshBasicMaterial sem luzes, então o relevo vem de um tom de luz "pintado" em cada face,
// multiplicado pela cor dos vértices e depois pela cor do material (a paleta do tema)
const LIGHT = new Vector3(-0.45, 0.8, 0.55).normalize();
const MIN_SHADE = 0.68;

export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// Cor única em todos os vértices (antes do sombreado)
export function paint(geometry, rgb = [1, 1, 1]) {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) colors.set(rgb, i * 3);
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

// Multiplica o tom de luz de cada face sobre as cores que a geometria já tem
export function shadeOnto(geometry) {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  flat.computeVertexNormals();
  const normals = flat.attributes.normal;
  const colors = flat.attributes.color;
  const n = new Vector3();
  for (let i = 0; i < normals.count; i += 1) {
    n.fromBufferAttribute(normals, i);
    const shade = MIN_SHADE + (1 - MIN_SHADE) * Math.max(0, n.dot(LIGHT));
    colors.setXYZ(i, colors.getX(i) * shade, colors.getY(i) * shade, colors.getZ(i) * shade);
  }
  return flat;
}

// Junta peças já pintadas e sombreia o conjunto. O merge exige os mesmos atributos em todas:
// ficam só posição e cor, sem índice (as normais são recalculadas no sombreado)
export function assemble(pieces) {
  return shadeOnto(mergeGeometries(pieces.map((p) => {
    const flat = p.index ? p.toNonIndexed() : p;
    flat.deleteAttribute('normal');
    flat.deleteAttribute('uv');
    return flat;
  })));
}

// Peça posicionada: escala, gira em y e move (em cima de uma geometria nova)
export function placed(geometry, { x = 0, y = 0, z = 0, rotY = 0, rotX = 0, rotZ = 0 } = {}) {
  if (rotX) geometry.rotateX(rotX);
  if (rotZ) geometry.rotateZ(rotZ);
  if (rotY) geometry.rotateY(rotY);
  geometry.translate(x, y, z);
  return geometry;
}
