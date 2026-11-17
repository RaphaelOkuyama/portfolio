import { describe, it, expect } from 'vitest';
import { gachaDraw, gachaPool } from '../../src/lib/gacha';
import { HANABI, hanabiChart, hanabiRank, judgeHit } from '../../src/lib/hanabi';
import { PETS, PET_SIZE, petPixels, readPets, togglePet, PETS_KEY } from '../../src/lib/pets';
import { retroDpr, RETRO_WIDTH } from '../../src/lib/retro';

const projects = [{ slug: 'a', title: 'A', shortDesc: 'x' }, { slug: 'b', title: 'B', shortDesc: 'y' }];
const certificates = [{ id: 1, name: 'Curso', institution: 'Escola', hours: 10 }];

describe('gachapon', () => {
  const pool = gachaPool({ projects, certificates }, 'pt');

  it('junta projetos, certificados e fatos, cada um com o seu destino', () => {
    expect(pool.filter((p) => p.kind === 'project').map((p) => p.href)).toEqual(['/projects/a', '/projects/b']);
    expect(pool.find((p) => p.kind === 'certificate')).toMatchObject({ title: 'Curso', text: 'Escola · 10 h', href: '/certificates' });
    expect(pool.filter((p) => p.kind === 'fact').length).toBeGreaterThan(3);
  });

  it('o peso escolhe o tipo: metade projetos, depois certificados e fatos', () => {
    expect(gachaDraw(pool, () => 0.1).kind).toBe('project');
    expect(gachaDraw(pool, () => 0.6).kind).toBe('certificate');
    expect(gachaDraw(pool, () => 0.9).kind).toBe('fact');
  });

  it('nunca repete o prêmio anterior', () => {
    const first = gachaDraw(pool, () => 0);
    for (let i = 0; i < 20; i += 1) expect(gachaDraw(pool, () => 0, first.id).id).not.toBe(first.id);
    // O único certificado acabou de sair: o sorteio cai em outro tipo
    expect(gachaDraw(pool, () => 0.6, 'c-1').kind).not.toBe('certificate');
  });
});

describe('hanabi', () => {
  it('a partitura começa depois da contagem e fica em ordem', () => {
    const notes = hanabiChart();
    expect(notes.length).toBeGreaterThan(20);
    expect(notes[0].time).toBeCloseTo(HANABI.lead, 6);
    expect(notes.every((n, i) => i === 0 || n.time > notes[i - 1].time)).toBe(true);
    expect(new Set(notes.map((n) => n.type))).toEqual(new Set(['don', 'ka']));
  });

  it('julga a batida pela distância até a nota do mesmo tipo', () => {
    const notes = hanabiChart('d.k.', 120, 1);
    expect(judgeHit(notes, 'don', 1.03)).toEqual({ index: 0, grade: 'good' });
    expect(judgeHit(notes, 'don', 1.12)).toEqual({ index: 0, grade: 'ok' });
    expect(judgeHit(notes, 'don', 1.4)).toBeNull();
    // Tipo errado não acerta, e nota já batida não conta de novo
    expect(judgeHit(notes, 'ka', 1.0)).toBeNull();
    notes[0].state = 'hit';
    expect(judgeHit(notes, 'don', 1.0)).toBeNull();
  });

  it('dá a nota em kanji', () => {
    expect(hanabiRank(32, 32)).toBe('秀');
    expect(hanabiRank(27, 32)).toBe('優');
    expect(hanabiRank(20, 32)).toBe('良');
    expect(hanabiRank(3, 32)).toBe('可');
  });
});

describe('bichinhos', () => {
  it('todo desenho tem a grade inteira, só cores da paleta e dois olhos', () => {
    expect(PETS.length).toBeGreaterThanOrEqual(6);
    PETS.forEach((pet) => {
      expect(pet.rows).toHaveLength(PET_SIZE);
      pet.rows.forEach((row) => {
        expect(row).toHaveLength(PET_SIZE);
        [...row].forEach((c) => expect(c === '.' || c in pet.palette).toBe(true));
      });
      expect(pet.rows.join('').split('e').length - 1).toBe(2);
    });
  });

  it('dormindo, os olhos viram um traço de meia altura', () => {
    const awake = petPixels(PETS[0]);
    const asleep = petPixels(PETS[0], { asleep: true });
    expect(awake.some((p) => p[3])).toBe(false);
    expect(asleep.filter((p) => p[3])).toHaveLength(2);
  });

  it('guarda mais de um bicho e ignora o que não conhece', () => {
    expect(togglePet(togglePet([], 'shiba'), 'kappa')).toEqual(['shiba', 'kappa']);
    expect(togglePet(['shiba', 'kappa'], 'shiba')).toEqual(['kappa']);
    const storage = { getItem: (k) => (k === PETS_KEY ? '["kappa","dragão","kappa","neko"]' : null) };
    expect(readPets(storage)).toEqual(['kappa', 'neko']);
    expect(readPets({ getItem: () => 'isto não é json' })).toEqual([]);
  });
});

describe('modo Famicom', () => {
  it('a cena é desenhada com a largura de um console antigo', () => {
    expect(retroDpr(1440) * 1440).toBeCloseTo(RETRO_WIDTH, 6);
    expect(retroDpr(200)).toBe(1);
  });
});
