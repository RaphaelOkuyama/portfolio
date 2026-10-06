import { describe, it, expect } from 'vitest';
import { WATER, createBall, gather, kick, lensMap, shapeMatrix, spray, stepBall, stepDrops } from '../../src/lib/cursor/waterBall';
import { DOMAIN, domainWords, typedSecret, voronoiShards } from '../../src/lib/domain';

describe('水玉: bola d\'água do cursor', () => {
  it('a bola segue o mouse e fica redonda quando para', () => {
    const ball = createBall(0, 0);
    for (let i = 0; i < 300; i += 1) stepBall(ball, { x: 100, y: 50 }, 1 / 60);
    expect(ball.x).toBeCloseTo(100, 0);
    expect(ball.y).toBeCloseTo(50, 0);
    expect(Math.abs(ball.s)).toBeLessThan(0.02);
  });

  it('correndo, a forma alonga no rumo do movimento sem mudar a área', () => {
    const ball = createBall(0, 0);
    for (let i = 0; i < 8; i += 1) stepBall(ball, { x: 400, y: 0 }, 1 / 60);
    const [a, b, c, d] = shapeMatrix(ball);
    expect(a).toBeGreaterThan(d);
    expect(a * d - b * c).toBeCloseTo(1, 1);
    expect(ball.s).toBeLessThanOrEqual(0.8);
  });

  it('o tapa achata e a gelatina volta ao lugar', () => {
    const ball = createBall(0, 0);
    kick(ball, 9);
    stepBall(ball, { x: 0, y: 0 }, 1 / 60);
    expect(ball.squash).toBeGreaterThan(0);
    for (let i = 0; i < 400; i += 1) stepBall(ball, { x: 0, y: 0 }, 1 / 60);
    expect(Math.abs(ball.squash)).toBeLessThan(0.01);
  });

  it('o mapa da lente é neutro fora do círculo e dobra para dentro na borda', () => {
    const size = 32;
    const map = lensMap(size);
    expect(map[0]).toBe(128);
    // Pixel perto da borda direita, na linha do meio: olha para a esquerda (R < 128)
    const o = ((size / 2) * size + size - 3) * 4;
    expect(map[o]).toBeLessThan(110);
  });

  it('as gotas da formação vão para o centro e somem ao chegar', () => {
    let drops = gather(100, 100, 6, 70, () => 0.5);
    for (let i = 0; i < 60; i += 1) drops = stepDrops(drops, 1 / 60);
    expect(drops).toHaveLength(0);
  });

  it('gotas caem com a gravidade e somem depois de um tempo', () => {
    const ball = createBall(0, 0);
    let drops = spray(ball, 5, {}, () => 0.5);
    expect(drops).toHaveLength(5);
    const y0 = drops[0].y;
    for (let i = 0; i < 30; i += 1) drops = stepDrops(drops, 1 / 60);
    expect(drops[0].vy).toBeGreaterThan(0);
    expect(drops[0].y).not.toBe(y0);
    for (let i = 0; i < 120; i += 1) drops = stepDrops(drops, 1 / 60);
    expect(drops).toHaveLength(0);
  });
});

describe('領域展開: Vazio Infinito', () => {
  it('reconhece a palavra secreta no meio de outras teclas', () => {
    let state = { buffer: '' };
    let hit = false;
    for (const key of ['x', 'D', 'o', 'Shift', 'm', 'a', 'i', 'n']) {
      state = typedSecret(state.buffer, key);
      hit = hit || state.hit;
    }
    expect(hit).toBe(true);
    expect(typedSecret('domai', 'x').hit).toBe(false);
    expect(DOMAIN.words).toContain('domain');
  });

  it('as palavras do vazio incluem as ferramentas e os números', () => {
    const words = domainWords([{ kanji: '言', items: ['TypeScript', 'GLSL'] }], ['42+']);
    expect(words).toEqual(expect.arrayContaining(['TypeScript', 'GLSL', '42+', '無量空処', '言']));
  });

  it('os cacos de Voronoi cobrem a tela inteira, menores perto do impacto', () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const list = voronoiShards(300, 200, 800, 600, 30, rand);
    const area = (poly) => Math.abs(poly.reduce((s, p, i) => {
      const q = poly[(i + 1) % poly.length];
      return s + p[0] * q[1] - q[0] * p[1];
    }, 0)) / 2;
    const total = list.reduce((s, c) => s + area(c.poly), 0);
    expect(total).toBeCloseTo(800 * 600, -2);
    const near = list.filter((c) => c.dist < 0.15).map((c) => area(c.poly));
    const far = list.filter((c) => c.dist > 0.4).map((c) => area(c.poly));
    const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean(near)).toBeLessThan(mean(far));
  });
});
