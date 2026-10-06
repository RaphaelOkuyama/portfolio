import { describe, it, expect } from 'vitest';
import { WATER, createBall, outline, spray, stepBall, stepDrops } from '../../src/lib/cursor/waterBall';
import { DOMAIN, domainWords, shards, typedSecret } from '../../src/lib/domain';

describe('水玉: bola d\'água do cursor', () => {
  it('a bola cresce até o raio de repouso e segue o mouse', () => {
    const ball = createBall(0, 0);
    for (let i = 0; i < 240; i += 1) stepBall(ball, { x: 100, y: 50 }, 1 / 60);
    expect(ball.x).toBeCloseTo(100, 0);
    expect(ball.y).toBeCloseTo(50, 0);
    const mean = ball.r.reduce((s, r) => s + r, 0) / ball.r.length;
    expect(mean).toBeGreaterThan(WATER.radius * 0.85);
    expect(mean).toBeLessThan(WATER.radius * 1.2);
  });

  it('correndo, ela estica na direção do movimento', () => {
    const ball = createBall(0, 0);
    for (let i = 0; i < 120; i += 1) stepBall(ball, { x: 0, y: 0 }, 1 / 60);
    // Puxa para a direita: a gota corre e alonga no eixo x, sem passar de ~2x o tamanho
    let widest = 0;
    let tallest = 0;
    for (let i = 0; i < 10; i += 1) {
      stepBall(ball, { x: 400, y: 0 }, 1 / 60);
      const pts = outline(ball);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      widest = Math.max(widest, Math.max(...xs) - Math.min(...xs));
      tallest = Math.max(tallest, Math.max(...ys) - Math.min(...ys));
    }
    expect(widest).toBeGreaterThan(tallest);
    expect(widest).toBeLessThan(WATER.radius * 2 * 2.2);
  });

  it('gotas caem com a gravidade e somem depois de um tempo', () => {
    const ball = createBall(0, 0);
    ball.r = ball.r.map(() => WATER.radius);
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

  it('os cacos cobrem a tela inteira a partir do ponto de impacto', () => {
    const list = shards(400, 300, 800, 600, { rays: 10, rings: 3 }, () => 0.5);
    expect(list).toHaveLength(30);
    // Os cacos de fora chegam além dos cantos da tela
    const far = Math.max(...list.flatMap((s) => s.poly.map(([x, y]) => Math.hypot(x - 400, y - 300))));
    expect(far).toBeGreaterThanOrEqual(500);
  });
});
