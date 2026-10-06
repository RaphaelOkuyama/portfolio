import { describe, it, expect } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { backgroundAlpha, coversScene, insideCircle, projectSphere } from '../../src/lib/journey/sceneClick';
import { MAX_RIPPLES, RIPPLE, addRipple, anyRipple, rippleAge } from '../../src/lib/journey/ripples';
import { COMET, cometPhase, cometPieces } from '../../src/lib/journey/comet';
import { eyeOpening } from '../../src/lib/journey/tsukuyomi';

describe('cliques na cena', () => {
  it('a esfera projetada fica no centro da tela quando a câmera olha para ela', () => {
    const camera = new PerspectiveCamera(50, 2, 0.1, 300);
    camera.position.set(0, 0, 10);
    camera.updateMatrixWorld();
    const hit = projectSphere(new Vector3(0, 0, 0), 1, camera, 800, 400, [new Vector3(), new Vector3()]);
    expect(hit.x).toBeCloseTo(400);
    expect(hit.y).toBeCloseTo(200);
    expect(hit.r).toBeGreaterThan(10);
    expect(insideCircle(400 + hit.r * 0.9, 200, hit.x, hit.y, hit.r)).toBe(true);
    expect(insideCircle(400 + hit.r * 1.1, 200, hit.x, hit.y, hit.r)).toBe(false);
  });

  it('atrás da câmera não conta', () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 300);
    camera.position.set(0, 0, 10);
    camera.updateMatrixWorld();
    expect(projectSphere(new Vector3(0, 0, 20), 1, camera, 400, 400, [new Vector3(), new Vector3()])).toBeNull();
  });

  it('cartão opaco por cima bloqueia o clique; fundo transparente deixa passar', () => {
    const card = { nodeType: 1, tagName: 'DIV', parentElement: null };
    const text = { nodeType: 1, tagName: 'P', parentElement: card };
    const styles = new Map([
      [text, { backgroundColor: 'rgba(0, 0, 0, 0)', backgroundImage: 'none' }],
      [card, { backgroundColor: 'rgb(22, 31, 51)', backgroundImage: 'none' }],
    ]);
    expect(coversScene(text, (n) => styles.get(n))).toBe(true);
    styles.set(card, { backgroundColor: 'transparent', backgroundImage: 'none' });
    expect(coversScene(text, (n) => styles.get(n))).toBe(false);
    expect(backgroundAlpha('rgba(1, 2, 3, 0.5)')).toBe(0.5);
    expect(backgroundAlpha('rgb(1 2 3 / 0.2)')).toBe(0.2);
  });
});

describe('波紋: anéis no rio', () => {
  it('buffer circular: o mais antigo é substituído', () => {
    const store = { items: Array.from({ length: MAX_RIPPLES }, () => ({ at: -Infinity })), next: 0 };
    for (let i = 0; i < MAX_RIPPLES + 2; i += 1) addRipple(i, 0, 1, 10 + i, store);
    expect(store.items[0].x).toBe(MAX_RIPPLES);
    expect(store.items[1].x).toBe(MAX_RIPPLES + 1);
  });

  it('o anel vive RIPPLE.life segundos', () => {
    const r = { at: 5 };
    expect(rippleAge(r, 4)).toBeNull();
    expect(rippleAge(r, 6)).toBe(1);
    expect(rippleAge(r, 5 + RIPPLE.life + 0.1)).toBeNull();
    const store = { items: [r] };
    expect(anyRipple(6, store)).toBe(true);
    expect(anyRipple(20, store)).toBe(false);
  });
});

describe('彗星: o cometa que se parte', () => {
  it('passa de tempos em tempos e some entre as passagens', () => {
    expect(cometPhase(0)).toBeNull();
    expect(cometPhase(COMET.first + 1)).toBeGreaterThan(0);
    expect(cometPhase(COMET.first + COMET.duration + 1)).toBeNull();
    expect(cometPhase(COMET.first + COMET.every + 1)).toBeCloseTo(cometPhase(COMET.first + 1));
  });

  it('um pedaço antes da quebra, dois depois; o pedaço solto cai abaixo do principal', () => {
    expect(cometPieces(COMET.split - 0.1)).toHaveLength(1);
    const [main, piece] = cometPieces(0.9);
    expect(piece).toBeDefined();
    expect(piece.y).toBeLessThan(main.y);
    expect(cometPieces(null)).toHaveLength(0);
  });
});

describe('無限月読: o olho abre', () => {
  it('de 0 a 1, sem passar de 1', () => {
    expect(eyeOpening(10, 10)).toBe(0);
    expect(eyeOpening(10.5, 10)).toBeGreaterThan(0.3);
    expect(eyeOpening(100, 10)).toBe(1);
  });
});
