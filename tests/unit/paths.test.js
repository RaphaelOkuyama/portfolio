import { describe, it, expect } from 'vitest';
import { Box3, Vector3 } from 'three';
import { gangiGeometry, sandoGeometry } from '../../src/components/scene/pathGeometry';
import { groundHeight } from '../../src/lib/journey/ground';
import { CAMERA_PATH, GARDEN, GROUND, PAGODA, RIVER, SANDO, TAIKOBASHI } from '../../src/components/scene/config';

const water = CAMERA_PATH[CAMERA_PATH.length - 1][1] - RIVER.drop;

describe('参道: o caminho de pedra', () => {
  const g = sandoGeometry();
  const pos = g.attributes.position;

  it('nunca pisa na clareira dos bambus de Tanabata (contorna pela direita)', () => {
    const halfX = GARDEN.size[0] / 2;
    const halfZ = GARDEN.size[1] / 2;
    for (let i = 0; i < pos.count; i += 1) {
      const inside = Math.abs(pos.getX(i)) < halfX && Math.abs(pos.getZ(i) - GARDEN.z) < halfZ;
      expect(inside).toBe(false);
    }
  });

  it('vai do começo da montanha até a cabeceira da ponte e, do outro lado, até o pagode', () => {
    const box = new Box3().setFromBufferAttribute(pos);
    expect(box.max.z).toBeGreaterThan(30);
    const [nearX, nearZ] = SANDO.points.at(-1);
    const [farX, farZ] = SANDO.farPoints[0];
    expect(Math.abs(nearX)).toBeCloseTo(TAIKOBASHI.span / 2, 0);
    expect(Math.abs(farX)).toBeCloseTo(TAIKOBASHI.span / 2, 0);
    expect(nearZ).toBe(TAIKOBASHI.z);
    expect(farZ).toBe(TAIKOBASHI.z);
    const [endX, endZ] = SANDO.farPoints.at(-1);
    expect(Math.hypot(endX - PAGODA.x, endZ - PAGODA.z)).toBeLessThan(6);
  });

  it('as lajes ficam por cima do chão e fora da água', () => {
    for (let i = 0; i < pos.count; i += 3) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ground = groundHeight(x, z, GROUND);
      expect(pos.getY(i)).toBeGreaterThan(ground - 0.2);
      if (z < -52) expect(ground).toBeGreaterThan(water - 0.1);
    }
  });
});

describe('雁木: a escadaria até a água', () => {
  it('desce da margem e os últimos degraus ficam submersos', () => {
    const box = new Box3().setFromBufferAttribute(gangiGeometry().attributes.position);
    expect(box.max.y).toBeGreaterThan(water + 1);
    // O topo do último degrau (o mais perto do meio do rio) fica abaixo da água
    const pos = gangiGeometry().attributes.position;
    let lowestTop = Infinity;
    for (let i = 0; i < pos.count; i += 1) {
      if (pos.getX(i) > box.max.x - 1.2) lowestTop = Math.min(lowestTop, pos.getY(i) > -0.8 ? pos.getY(i) : lowestTop);
    }
    expect(lowestTop).toBeLessThan(water);
    expect(new Vector3().copy(box.getCenter(new Vector3())).x).toBeLessThan(0);
  });
});

describe('刀掛け: a katana na margem', () => {
  it('fica em terra firme, fora do caminho e da escadaria', async () => {
    const { KATANA } = await import('../../src/components/scene/config');
    const { katanaGeometry } = await import('../../src/components/scene/shrineGeometry');
    expect(groundHeight(KATANA.x, KATANA.z, GROUND)).toBeGreaterThan(water);
    const parts = katanaGeometry();
    ['stone', 'lacquer', 'saya', 'wrap', 'metal'].forEach((k) => expect(parts[k].attributes.position.count).toBeGreaterThan(0));
    const reach = 1 * KATANA.scale;
    const pos = sandoGeometry().attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      expect(Math.hypot(pos.getX(i) - KATANA.x, pos.getZ(i) - KATANA.z)).toBeGreaterThan(reach);
    }
  });
});

describe('参道 na margem: a camada de montanha da beira do rio não engole o caminho', () => {
  it('da câmera chegando à margem, as lajes atrás da camada ficam à vista', async () => {
    const { CatmullRomCurve3: Curve } = await import('three');
    const { MOUNTAIN_LAYERS, FOREST } = await import('../../src/components/scene/config');
    const { ridgePoints } = await import('../../src/lib/journey/ridge');
    const { ridgeHeightAt, forestPlacements } = await import('../../src/lib/journey/landscape');
    const layer = MOUNTAIN_LAYERS.reduce((a, b) => (Math.abs(b.z + 51) < Math.abs(a.z + 51) ? b : a));
    const points = ridgePoints(layer);
    const trees = forestPlacements(points, {
      seed: layer.seed + 5, count: FOREST.count.high, halfWidth: FOREST.halfWidth,
      valleyHalf: layer.forestValleyHalf ?? FOREST.valleyHalf, valleyCenter: layer.valleyCenter,
    }).map(([x, y, s]) => [x, y, s * (1 + MOUNTAIN_LAYERS.indexOf(layer) * FOREST.growWithDistance)]);
    const silhouette = (x) => {
      let top = ridgeHeightAt(points, x - layer.x);
      trees.forEach(([tx, ty, s]) => {
        const half = 0.42 * s * 0.8;
        if (Math.abs(x - tx) < half) top = Math.max(top, ty + 1.45 * s * (1 - Math.abs(x - tx) / half));
      });
      return top;
    };
    const camera = new Curve(CAMERA_PATH.map((p) => new Vector3(...p)));
    const eyes = camera.getSpacedPoints(200).filter((p) => p.z < -38 && p.z > layer.z + 2);
    expect(eyes.length).toBeGreaterThan(0);
    // Centros das fileiras de lajes logo atrás da camada, até a altura da escadaria
    const slabs = new Curve(SANDO.points.map(([x, z]) => new Vector3(x, 0, z)), false, 'centripetal')
      .getSpacedPoints(300)
      .filter((p) => p.z < layer.z - 1 && p.z > -84)
      .map((p) => new Vector3(p.x, groundHeight(p.x, p.z, GROUND) + 0.1, p.z));
    let hidden = 0;
    eyes.forEach((eye) => slabs.forEach((slab) => {
      const t = (eye.z - layer.z) / (eye.z - slab.z);
      const x = eye.x + (slab.x - eye.x) * t;
      const y = eye.y + (slab.y - eye.y) * t;
      if (y < silhouette(x)) hidden += 1;
    }));
    expect(hidden).toBe(0);
  });
});
