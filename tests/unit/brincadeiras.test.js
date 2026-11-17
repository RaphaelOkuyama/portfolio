import { describe, it, expect } from 'vitest';
import { GACHA_KEY, collect, gachaDraw, gachaPool, readCollection } from '../../src/lib/gacha';
import { HANABI, HANABI_ACTS, hanabiProgram } from '../../src/lib/hanabi';
import { TAIKO, TAIKO_LEVELS, hitScore, judgeHit, levelChart, readBest, saveBest, soulStep, taikoChart, taikoRank } from '../../src/lib/taiko';
import { effectiveProgress } from '../../src/store/journey';
import { PETS, PET_STARTERS, petFamily, evolvedPet, readPets, savePets, togglePet, PETS_KEY, PET_SHINY_KEY, readPetShiny, savePetShiny, SHINY_ODDS, SHINY_RATE, rollShiny, shinyChanceIn, triesFor } from '../../src/lib/pets';
import { readFileSync } from 'node:fs';
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

  it('cada prêmio tem raridade: o projeto em produção é SSR, a vitrine é SR, fatos são N', () => {
    const rare = gachaPool({ projects: [{ slug: 'a', title: 'A', featured: true }, { slug: 'b', title: 'B' }, { slug: 'c', title: 'C' }], certificates }, 'pt', ['b']);
    expect(rare.filter((p) => p.kind === 'project').map((p) => p.rarity)).toEqual(['SSR', 'SR', 'R']);
    expect(rare.find((p) => p.kind === 'certificate').rarity).toBe('R');
    expect(rare.filter((p) => p.kind === 'fact').every((p) => p.rarity === 'N')).toBe(true);
  });

  it('a coleção guarda o que já saiu, sem repetir e sem o que não existe mais', () => {
    const data = {};
    const storage = { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
    const first = collect(storage, [], 'p-a');
    expect(first).toEqual({ collection: ['p-a'], fresh: true });
    expect(collect(storage, first.collection, 'p-a')).toEqual({ collection: ['p-a'], fresh: false });
    data[GACHA_KEY] = '["p-a","p-sumiu","p-a","f-0"]';
    expect(readCollection(storage, pool)).toEqual(['p-a', 'f-0']);
    expect(readCollection({ getItem: () => 'isto não é json' }, pool)).toEqual([]);
  });

  it('nunca repete o prêmio anterior', () => {
    const first = gachaDraw(pool, () => 0);
    for (let i = 0; i < 20; i += 1) expect(gachaDraw(pool, () => 0, first.id).id).not.toBe(first.id);
    // O único certificado acabou de sair: o sorteio cai em outro tipo
    expect(gachaDraw(pool, () => 0.6, 'c-1').kind).not.toBe('certificate');
  });
});

describe('hanabi', () => {
  it('o programa vem em ordem, passa por todos os atos e termina', () => {
    const program = hanabiProgram(() => 0.5);
    expect(program.every((step, i) => i === 0 || step.t >= program[i - 1].t)).toBe(true);
    expect(program.filter((s) => s.act !== undefined).map((s) => HANABI_ACTS[s.act].id)).toEqual(HANABI_ACTS.map((a) => a.id));
    expect(program.at(-1).end).toBe(true);
    expect(program.filter((s) => s.fire).length).toBeGreaterThan(80);
  });

  it('tem a Niágara na ponte e a casca gigante, cada uma no seu ato', () => {
    const program = hanabiProgram(() => 0.5);
    const actAt = (t) => HANABI_ACTS[program.filter((s) => s.act !== undefined && s.t <= t).at(-1).act].id;
    expect(actAt(program.find((s) => s.niagara).t)).toBe('niagara');
    expect(actAt(program.find((s) => s.fire?.kind === 'giant').t)).toBe('yonshaku');
    // Todo fogo cabe no céu visível
    program.filter((s) => s.fire).forEach(({ fire }) => {
      expect(Math.abs(fire.x)).toBeLessThanOrEqual(1);
      if (fire.y !== undefined) expect(fire.y).toBeGreaterThanOrEqual(0);
    });
  });

  it('antes de acabar sobe uma bolinha só, o ōtori, e o show anda em câmera lenta', () => {
    const program = hanabiProgram(() => 0.5);
    const fires = program.filter((s) => s.fire);
    const last = fires.at(-1);
    expect(last.fire.kind).toBe('otori');
    expect(fires.filter((s) => s.fire.kind === 'otori')).toHaveLength(1);
    // Céu limpo antes dela, e tempo para as flores abrirem antes do fim
    expect(last.t - fires.at(-2).t).toBeGreaterThan(5);
    expect(program.at(-1).t - last.t).toBeGreaterThan(12);
    expect(HANABI.slow).toBeLessThan(1);
    expect(program.at(-1).t).toBeGreaterThan(90);
  });

  it('a palavra do festival não é a do jogo de taiko', () => {
    expect(HANABI.words).toEqual(['hanabi']);
    expect(TAIKO.words).toContain('taiko');
    expect(TAIKO.words).not.toContain('hanabi');
  });

  it('durante o festival a cena vai para o fim do caminho, em qualquer rota', () => {
    expect(effectiveProgress({ festival: true, route: 'frozen', progress: 0.1 })).toBe(1);
    expect(effectiveProgress({ festival: false, route: 'journey', progress: 0.1 })).toBe(0.1);
  });
});

describe('taiko', () => {
  it('cada nível tem a partitura em ordem, com don, ka e nota grande, depois da contagem', () => {
    expect(TAIKO_LEVELS.map((l) => l.id)).toEqual(['kantan', 'futsuu', 'oni']);
    TAIKO_LEVELS.forEach((level) => {
      const notes = levelChart(level);
      expect(notes.length).toBeGreaterThan(30);
      expect(notes[0].time).toBeCloseTo(TAIKO.leadBeats * (60 / level.bpm), 6);
      expect(notes.every((n, i) => i === 0 || n.time > notes[i - 1].time)).toBe(true);
      expect(new Set(notes.map((n) => n.type))).toEqual(new Set(['don', 'ka']));
      expect(notes.some((n) => n.big)).toBe(true);
    });
    // Os níveis ficam mais cheios
    const counts = TAIKO_LEVELS.map((l) => levelChart(l).length);
    expect(counts[0]).toBeLessThan(counts[1]);
    expect(counts[1]).toBeLessThan(counts[2]);
  });

  it('julga a batida pela distância até a nota do mesmo tipo', () => {
    const notes = taikoChart('d.K.', 120, 1);
    expect(notes[1]).toMatchObject({ type: 'ka', big: true, time: 1.5 });
    expect(judgeHit(notes, 'don', 1.03)).toEqual({ index: 0, grade: 'good' });
    expect(judgeHit(notes, 'don', 1.11)).toEqual({ index: 0, grade: 'ok' });
    expect(judgeHit(notes, 'don', 1.4)).toBeNull();
    // Tipo errado não acerta, e nota já batida não conta de novo
    expect(judgeHit(notes, 'ka', 1.0)).toBeNull();
    notes[0].state = 'hit';
    expect(judgeHit(notes, 'don', 1.0)).toBeNull();
  });

  it('a sequência aumenta os pontos até o dobro e a nota grande dobra', () => {
    expect(hitScore('good', 1)).toBe(100);
    expect(hitScore('ok', 1)).toBe(50);
    expect(hitScore('good', 10)).toBe(110);
    expect(hitScore('good', 500)).toBe(200);
    expect(hitScore('good', 1, true)).toBe(200);
  });

  it('a barra da alma só enche até o fim com acertos em cheio', () => {
    const total = 40;
    expect(soulStep('good', total) * total).toBeGreaterThan(1);
    expect(soulStep('ok', total) * total).toBeLessThan(TAIKO.clear);
    expect(soulStep('miss', total)).toBeLessThan(0);
  });

  it('dá a nota em kanji pela precisão', () => {
    expect(taikoRank(32, 0, 32)).toBe('秀');
    expect(taikoRank(20, 10, 32)).toBe('優');
    expect(taikoRank(10, 14, 32)).toBe('良');
    expect(taikoRank(2, 3, 32)).toBe('可');
  });

  it('guarda o recorde de cada nível só quando ele é batido', () => {
    const data = {};
    const storage = { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
    expect(saveBest(storage, 'kantan', 1200)).toEqual({ best: { kantan: 1200 }, record: true });
    expect(saveBest(storage, 'kantan', 800).record).toBe(false);
    expect(saveBest(storage, 'oni', 300).best).toEqual({ kantan: 1200, oni: 300 });
    expect(readBest({ getItem: () => 'isto não é json' })).toEqual({});
    expect(readBest({ getItem: () => '{"kantan":"x","outro":5}' })).toEqual({});
  });
});

describe('companheiro Pokémon', () => {
  it('inclui as nove linhas evolutivas completas das gerações 1, 3 e 6, com sprites locais', () => {
    expect(PETS).toHaveLength(27);
    expect(PET_STARTERS).toHaveLength(9);
    expect(new Set(PETS.map((pet) => pet.id)).size).toBe(27);
    for (const generation of [1, 3, 6]) {
      expect(PET_STARTERS.filter((pet) => pet.generation === generation)).toHaveLength(3);
    }
    PET_STARTERS.forEach((starter) => {
      const family = petFamily(starter.id);
      expect(family.map((pet) => pet.stage)).toEqual([0, 1, 2]);
      family.forEach((pet) => {
        const bytes = readFileSync(new URL(`../../public${pet.sprite}`, import.meta.url));
        expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        const shiny = readFileSync(new URL(`../../public${pet.shinySprite}`, import.meta.url));
        expect(shiny.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        expect(shiny.equals(bytes)).toBe(false);
        expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual(pet.size);
        expect([shiny.readUInt32BE(16), shiny.readUInt32BE(20)]).toEqual(pet.shinySize);
      });
    });
  });

  it('evolui em Projetos e no Contato ou ao terminar a trilha, sem regredir', () => {
    PET_STARTERS.forEach((starter) => {
      const family = petFamily(starter.id);
      expect(evolvedPet(starter.id, { section: 'stack', progress: 0.3 })).toBe(family[0]);
      expect(evolvedPet(starter.id, { section: 'projects', progress: 0.5 })).toBe(family[1]);
      expect(evolvedPet(starter.id, { section: 'contato', progress: 0.9 })).toBe(family[2]);
      expect(evolvedPet(starter.id, { section: 'hero', progress: 0.99 })).toBe(family[2]);
      expect(evolvedPet(family[2].id, { section: 'hero', progress: 0 })).toBe(family[2]);
    });
    expect(evolvedPet('sumiu', { section: 'projects' })).toBeUndefined();
  });

  it('não evolui por câmera do festival, modo foto ou páginas fora da trilha', () => {
    for (const mode of [{ route: 'frozen' }, { festival: true }, { photo: true }]) {
      expect(evolvedPet('froakie', { section: 'contato', progress: 1, ...mode }).id).toBe('froakie');
    }
    expect(evolvedPet('froakie', { route: 'frozen', projectsOpen: true, section: 'contato', progress: 1 }).id).toBe('frogadier');
  });

  it('escolhe um inicial por vez, retira pela família e não permite selecionar evolução diretamente', () => {
    expect(togglePet([], 'charmander')).toEqual(['charmander']);
    expect(togglePet(['charmander'], 'mudkip')).toEqual(['mudkip']);
    expect(togglePet(['charizard'], 'charmander')).toEqual([]);
    expect(togglePet(['charmander'], 'charizard')).toEqual(['charmander']);
    expect(togglePet(['charmander'], 'shiba')).toEqual(['charmander']);
  });

  it('salva a forma evoluída e tolera dados antigos, corrompidos ou armazenamento bloqueado', () => {
    const data = {};
    const storage = { getItem: (key) => data[key] ?? null, setItem: (key, value) => { data[key] = value; } };
    savePets(storage, ['greninja']);
    expect(readPets(storage)).toEqual(['greninja']);
    data[PETS_KEY] = '["shiba","kappa","froakie","mudkip"]';
    expect(readPets(storage)).toEqual(['froakie']);
    for (const raw of ['isto não é json', '{}', 'null', '["neko"]']) {
      expect(readPets({ getItem: () => raw })).toEqual([]);
    }
    const blocked = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(readPets(blocked)).toEqual([]);
    expect(() => savePets(blocked, ['treecko'])).not.toThrow();
  });

  it('o shiny sai no sorteio: 1 em 20 por inicial escolhido, com a conta da chance acumulada', () => {
    expect(SHINY_ODDS).toBe(20);
    expect(SHINY_RATE).toBeCloseTo(0.05, 10);
    expect(rollShiny(() => 0)).toBe(true);
    expect(rollShiny(() => 0.0499)).toBe(true);
    expect(rollShiny(() => 0.05)).toBe(false);
    expect(rollShiny(() => 0.99)).toBe(false);
    // 1 - 0,95^n: uma escolha 5%, dez 40,1%, catorze passa da metade
    expect(shinyChanceIn(1)).toBeCloseTo(0.05, 10);
    expect(shinyChanceIn(10)).toBeCloseTo(0.4013, 4);
    expect(shinyChanceIn(13)).toBeLessThan(0.5);
    expect(shinyChanceIn(14)).toBeGreaterThan(0.5);
    expect(triesFor(0.5)).toBe(14);
    // Num sorteio de verdade, perto de 5% dá shiny
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const hits = Array.from({ length: 20000 }, () => rollShiny(rand)).filter(Boolean).length;
    expect(hits / 20000).toBeGreaterThan(0.045);
    expect(hits / 20000).toBeLessThan(0.055);
  });

  it('salva se o companheiro saiu shiny sem alterar o companheiro ou a forma evoluída', () => {
    const data = { [PETS_KEY]: '["charizard"]' };
    const storage = { getItem: (key) => data[key] ?? null, setItem: (key, value) => { data[key] = value; } };
    expect(readPetShiny(storage)).toBe(false);
    savePetShiny(storage, true);
    expect(data[PET_SHINY_KEY]).toBe('on');
    expect(readPetShiny(storage)).toBe(true);
    expect(readPets(storage)).toEqual(['charizard']);
    savePetShiny(storage, false);
    expect(readPetShiny(storage)).toBe(false);
    const blocked = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(readPetShiny(blocked)).toBe(false);
    expect(() => savePetShiny(blocked, true)).not.toThrow();
  });
});

describe('modo Famicom', () => {
  it('a cena é desenhada com a largura de um console antigo', () => {
    expect(retroDpr(1440) * 1440).toBeCloseTo(RETRO_WIDTH, 6);
    expect(retroDpr(200)).toBe(1);
  });
});
