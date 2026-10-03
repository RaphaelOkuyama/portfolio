import { describe, it, expect } from 'vitest';
import { Box3, Vector3 } from 'three';
import {
  bambooLeavesGeometry, bambooStalkGeometry, komainuGeometry, kodamaGeometry, pagodaGeometry,
  shishiOdoshiGeometry, stoneLanternGeometry, taikobashiGeometry,
} from '../../src/components/scene/shrineGeometry';
import { feedScrollVelocity, stepWind, wind } from '../../src/lib/journey/wind';
import { SEASON_INKS, seasonInk } from '../../src/lib/dentoushoku';
import { TAIKOBASHI, RIVER, GROUND, CAMERA_PATH } from '../../src/components/scene/config';
import { groundHeight } from '../../src/lib/journey/ground';

const box = (g) => new Box3().setFromBufferAttribute(g.attributes.position);
const size = (g) => box(g).getSize(new Vector3());

describe('peças do santuário', () => {
  it('todas assentam no chão (base em y = 0) e já vêm com o tom de luz nos vértices', () => {
    const pieces = [
      komainuGeometry('a'), komainuGeometry('un'), stoneLanternGeometry().stone,
      shishiOdoshiGeometry().fixed, pagodaGeometry().plaster, bambooStalkGeometry(), kodamaGeometry().body,
    ];
    for (const g of pieces) {
      expect(box(g).min.y).toBeCloseTo(0, 1);
      expect(g.attributes.color).toBeTruthy();
    }
  });

  it('狛犬: o "a" e o "un" são diferentes (boca aberta x boca fechada com chifre) e em cache', () => {
    const a = komainuGeometry('a');
    const un = komainuGeometry('un');
    expect(a).not.toBe(un);
    expect(komainuGeometry('a')).toBe(a);
    // O chifre do "un" passa da altura da cabeça do "a"
    expect(box(un).max.y).toBeGreaterThan(box(a).max.y);
  });

  it('石灯籠: a luz fica dentro da caixa de pedra, na altura do 火袋', () => {
    const { stone, light } = stoneLanternGeometry();
    const l = box(light);
    const s = box(stone);
    expect(l.min.y).toBeGreaterThan(1.6);
    expect(l.max.y).toBeLessThan(s.max.y);
    expect(size(light).x).toBeLessThan(size(stone).x);
  });

  it('太鼓橋: vai de margem a margem (as pontas pousam em terra, acima da água) e o arco sobe', () => {
    const { red, dark, bronze } = taikobashiGeometry(TAIKOBASHI);
    const water = CAMERA_PATH[CAMERA_PATH.length - 1][1] - RIVER.drop;
    // No meio do vão, sob a ponte, é água; nas duas pontas, a margem já está acima dela
    expect(groundHeight(0, TAIKOBASHI.z, GROUND)).toBeLessThan(water);
    for (const end of [-1, 1]) expect(groundHeight(end * TAIKOBASHI.span / 2, TAIKOBASHI.z, GROUND)).toBeGreaterThan(water);
    expect(size(dark).x).toBeCloseTo(TAIKOBASHI.span, 0);
    expect(box(dark).max.y).toBeGreaterThan(TAIKOBASHI.rise);
    // Pilares descem para dentro da água (abaixo de y = 0)
    expect(box(red).min.y).toBeLessThan(0);
    expect(bronze.attributes.position.count).toBeGreaterThan(0);
  });

  it('五重塔: proporções dos pagodes reais (altura ~5× o térreo, beirais largos, sōrin no topo)', () => {
    const { red, plaster, roof, bronze } = pagodaGeometry();
    const total = box(bronze).max.y;
    // Altura total ≈ 5,1× a largura do térreo (2,6)
    expect(total / 2.6).toBeGreaterThan(4.5);
    expect(total / 2.6).toBeLessThan(5.8);
    // O beiral do primeiro telhado é bem mais largo que o corpo
    expect(size(roof).x).toBeGreaterThan(2.6 * 2);
    // O sōrin é o ponto mais alto, acima de todos os telhados
    expect(total).toBeGreaterThan(box(roof).max.y + 2);
    expect(red.attributes.color && plaster.attributes.color).toBeTruthy();
  });

  it('竹 e 木霊: caule de altura 1 (a instância estica), tufo de folhas e o kodama em três peças', () => {
    expect(size(bambooStalkGeometry()).y).toBeCloseTo(1, 1);
    expect(bambooLeavesGeometry().attributes.position.count).toBeGreaterThan(0);
    const { body, head, face } = kodamaGeometry();
    expect(body && head && face).toBeTruthy();
  });
});

describe('風神 vento do scroll', () => {
  it('rolar devagar não venta; rolar rápido levanta a rajada, que depois acalma', () => {
    wind.gust = 0;
    feedScrollVelocity(2);
    expect(wind.target).toBe(0);
    feedScrollVelocity(60);
    expect(wind.target).toBe(1);
    for (let i = 0; i < 20; i += 1) stepWind(1 / 60);
    const peak = wind.gust;
    expect(peak).toBeGreaterThan(0.5);
    for (let i = 0; i < 300; i += 1) stepWind(1 / 60);
    expect(wind.gust).toBeLessThan(peak / 4);
  });
});

describe('伝統色 cores tradicionais por estação', () => {
  it('quatro cores por tema, com nome em kanji, leitura e hex', () => {
    for (const theme of ['night', 'day']) {
      expect(SEASON_INKS[theme]).toHaveLength(4);
      SEASON_INKS[theme].forEach((ink) => {
        expect(ink.hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(ink.kanji).toMatch(/\p{Script=Han}/u);
      });
    }
  });

  it('nas estações exatas devolve a cor da lista; entre elas mistura e usa o nome mais próximo', () => {
    expect(seasonInk('night', 0)).toMatchObject({ kanji: '桃色', hex: '#f09199' });
    expect(seasonInk('day', 3)).toMatchObject({ kanji: '藍色', hex: '#165e83' });
    const between = seasonInk('night', 1.4);
    expect(between.kanji).toBe('若竹色');
    expect(between.hex).not.toBe('#68be8d');
    expect(seasonInk('night', 9).kanji).toBe('白藍');
  });
});
