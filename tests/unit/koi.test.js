import { describe, it, expect } from 'vitest';
import { angleDelta, clampToZone, insideZone, orbitPoint, separation, swimStep } from '../../src/lib/journey/koi';

const zone = { x: [-4, 4], z: [38, 52] };
const opts = { zone, turn: 1.6, slowRadius: 1.2 };
const koi = (over = {}) => ({ x: 0, z: 45, heading: 0, speed: 0.6, ...over });

describe('鯉: nado das carpas', () => {
  it('angleDelta pega o menor caminho', () => {
    expect(angleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(angleDelta(Math.PI * 0.9, -Math.PI * 0.9)).toBeCloseTo(Math.PI * 0.2);
    expect(angleDelta(-Math.PI * 0.9, Math.PI * 0.9)).toBeCloseTo(-Math.PI * 0.2);
  });

  it('vira aos poucos rumo ao alvo e chega perto dele', () => {
    let k = koi({ heading: Math.PI });
    const target = { x: 2, z: 48 };
    const first = swimStep(k, target, 0.1, opts);
    // A virada por passo é limitada pela taxa
    expect(Math.abs(angleDelta(k.heading, first.heading))).toBeLessThanOrEqual(1.6 * 0.1 + 1e-9);
    for (let i = 0; i < 400; i += 1) k = swimStep(k, target, 1 / 30, opts);
    expect(Math.hypot(k.x - target.x, k.z - target.z)).toBeLessThan(1);
  });

  it('desacelera ao chegar, mas nunca para', () => {
    const near = swimStep(koi(), { x: 0, z: 45.1 }, 0.1, opts);
    expect(near.effort).toBeLessThan(0.5);
    expect(near.effort).toBeGreaterThan(0.3);
  });

  it('fora da zona volta para o centro dela', () => {
    let k = koi({ x: 8, z: 45, heading: Math.PI / 2 });
    for (let i = 0; i < 600; i += 1) k = swimStep(k, { x: 20, z: 45 }, 1 / 30, opts);
    expect(insideZone(k.x, k.z, { x: [-4.5, 4.5], z: [37.5, 52.5] })).toBe(true);
  });

  it('separação empurra carpas sobrepostas para lados opostos', () => {
    const a = koi({ x: 0 });
    const b = koi({ x: 0.2 });
    const [pa] = separation(a, [a, b], 0.8);
    const [pb] = separation(b, [a, b], 0.8);
    expect(pa).toBeLessThan(0);
    expect(pb).toBeGreaterThan(0);
    expect(separation(a, [a, koi({ x: 3 })], 0.8)).toEqual([0, 0]);
  });

  it('a roda em volta de um ponto fica no raio pedido', () => {
    const p = orbitPoint({ x: 1, z: 44 }, 2, 5, 3, 0.9);
    expect(Math.hypot(p.x - 1, p.z - 44)).toBeCloseTo(0.9);
    expect(clampToZone(9, 30, zone)).toEqual({ x: 4, z: 38 });
  });
});
