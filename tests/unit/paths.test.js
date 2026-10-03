import { describe, it, expect } from 'vitest';
import { Box3, Vector3 } from 'three';
import { gangiGeometry, sandoGeometry } from '../../src/components/scene/pathGeometry';
import { groundHeight } from '../../src/lib/journey/ground';
import { CAMERA_PATH, GARDEN, GROUND, PAGODA, RIVER, SANDO, TAIKOBASHI } from '../../src/components/scene/config';

const water = CAMERA_PATH[CAMERA_PATH.length - 1][1] - RIVER.drop;

describe('参道: o caminho de pedra', () => {
  const g = sandoGeometry();
  const pos = g.attributes.position;

  it('nunca pisa na areia do jardim zen (contorna pela direita)', () => {
    const halfX = GARDEN.size[0] / 2 + GARDEN.border;
    const halfZ = GARDEN.size[1] / 2 + GARDEN.border;
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
