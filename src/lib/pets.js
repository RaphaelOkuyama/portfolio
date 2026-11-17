// 育: os bichinhos em pixel que moram no canto da tela, todos do imaginário japonês. Cada um é um
// desenho de 12x12 em texto: uma letra por pixel, com a paleta do bicho. 'e' são os olhos (viram
// um traço quando ele dorme) e '.' é vazio

export const PET_SIZE = 12;

export const PETS = [
  {
    id: 'shiba', kanji: '柴', name: { pt: 'Shiba', en: 'Shiba' },
    palette: { o: '#d98a3d', w: '#fbf3e4', k: '#2a1c14', e: '#2a1c14', p: '#e8736a' },
    rows: [
      '.oo......oo.',
      '.ooo....ooo.',
      '.oooooooooo.',
      'oooooooooooo',
      'ooeoowwooeoo',
      'oowwwwwwwwoo',
      'owwwwkkwwwwo',
      '.wwwwppwwww.',
      '..wwwwwwww..',
      '.oowwwwwwoo.',
      '.oo.wwww.oo.',
      '.ww......ww.',
    ],
  },
  {
    id: 'neko', kanji: '猫', name: { pt: 'Maneki-neko', en: 'Maneki-neko' },
    palette: { w: '#fbf7ee', k: '#2a2a2e', e: '#2a2a2e', r: '#c8322a', y: '#e8b63c', p: '#f2a3a0' },
    rows: [
      '.ww....ww.ww',
      '.wpw..wpw.ww',
      '.wwwwwwww.ww',
      'wwwwwwwwwwww',
      'wwewwwwewww.',
      'wwwwwkwwwww.',
      'wpwwwwwwwpw.',
      '.rrrrrrrrr..',
      '.wwwwywwww..',
      '.wwwyyywww..',
      '.wwwwywwww..',
      '.ww.....ww..',
    ],
  },
  {
    id: 'tanuki', kanji: '狸', name: { pt: 'Tanuki', en: 'Tanuki' },
    palette: { b: '#8a6a4a', d: '#3d2c20', w: '#f0e4cf', e: '#f0e4cf', g: '#5c8a4a', k: '#1f1712' },
    rows: [
      '....ggg.....',
      '.bb.gg..bb..',
      '.bbbbbbbbb..',
      'bbbbbbbbbbb.',
      'bddbbbbbddb.',
      'bdedbbbdedb.',
      'bbddwkwddbb.',
      '.bbwwwwwbb..',
      '.bbwwwwwbbdd',
      '.bwwwwwwwbdd',
      '.bbwwwwwbbd.',
      '.dd.....dd..',
    ],
  },
  {
    id: 'kappa', kanji: '河', name: { pt: 'Kappa', en: 'Kappa' },
    palette: { g: '#5fa56a', d: '#356b45', w: '#dff3f6', e: '#1c2a20', y: '#e8b63c', s: '#7a5a34' },
    rows: [
      '...dwwwwd...',
      '..ddwwwwdd..',
      '.dggggggggd.',
      '.gggggggggg.',
      '.ggegggggeg.',
      '.gggyyyyggg.',
      '..ggyyyygg..',
      '.sggggggggs.',
      'ssgggggggss.',
      'ssgggggggss.',
      '.sgg....ggs.',
      '..yy....yy..',
    ],
  },
  {
    id: 'daruma', kanji: '達', name: { pt: 'Daruma', en: 'Daruma' },
    palette: { r: '#c8322a', d: '#8f1d18', w: '#fbf3e4', e: '#1b1b1b', k: '#1b1b1b', y: '#e8b63c' },
    rows: [
      '...rrrrrr...',
      '..rrrrrrrr..',
      '.rrwwwwwwrr.',
      '.rwkkwwkkwr.',
      'rrwewwwwewrr',
      'rrwwwwwwwwrr',
      'rrwwkkkkwwrr',
      'rrrwwwwwwrrr',
      'rrryyrryyrrr',
      '.rrryyyyrrr.',
      '.drrrrrrrrd.',
      '..dddddddd..',
    ],
  },
  {
    id: 'onigiri', kanji: '握', name: { pt: 'Onigiri', en: 'Onigiri' },
    palette: { w: '#fbf7ee', s: '#d9d2c2', n: '#1f2a22', e: '#1f2a22', p: '#f2a3a0', k: '#1f2a22' },
    rows: [
      '.....ww.....',
      '....wwww....',
      '...wwwwww...',
      '..wwwwwwww..',
      '..wewwwwew..',
      '.wwwwwwwwww.',
      '.wpwwkkwwpw.',
      'wwwwwwwwwwww',
      'wwwnnnnnnwww',
      'swwnnnnnnwws',
      '.ssnnnnnnss.',
      '..ssssssss..',
    ],
  },
];

export const PET_IDS = PETS.map((p) => p.id);
export const PETS_KEY = 'oku-pets';
export const MAX_PETS = PETS.length;

// Escolha salva: só ids conhecidos, sem repetir
export function readPets(storage) {
  try {
    const raw = JSON.parse(storage.getItem(PETS_KEY) ?? '[]');
    return Array.isArray(raw) ? [...new Set(raw.filter((id) => PET_IDS.includes(id)))] : [];
  } catch {
    return [];
  }
}

export function savePets(storage, ids) {
  try {
    storage.setItem(PETS_KEY, JSON.stringify(ids));
  } catch {
    // Storage bloqueado: a escolha só vale nesta visita
  }
}

export const togglePet = (ids, id) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

// Pixels do bicho como [x, y, cor, meio]. Dormindo, cada olho vira o pelo em volta com um traço
// na metade de baixo do pixel (a pálpebra fechada); `meio` marca esse traço
export function petPixels(pet, { asleep = false } = {}) {
  const out = [];
  pet.rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === '.') return;
      if (c === 'e' && asleep) {
        const left = row[x - 1];
        const around = left && left !== 'e' && left !== '.' ? left : row[x + 1];
        out.push([x, y, pet.palette[around] ?? pet.palette.e, false]);
        out.push([x, y, pet.palette.k ?? pet.palette.e, true]);
        return;
      }
      out.push([x, y, pet.palette[c], false]);
    });
  });
  return out;
}
