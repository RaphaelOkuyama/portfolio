// Fonte única das cores. globals.css espelha THEMES (testado em tests/unit/palette.test.js).

export const THEME_NAMES = ['night', 'day'];

// 夜 noite: índigo (藍) com acento dourado · 昼 dia: papel washi com acento shu (朱)
export const THEMES = {
  night: {
    bgColor: '#0f1626',
    textPrimary: '#e8e4da',
    textSecondary: '#a7adbd',
    accent: '#d9a441',
    onAccent: '#1b1405',
    border: '#2a3450',
    cardBg: '#161f33',
    ink: '#e8e4da',
    paper: '#1b2438',
  },
  day: {
    bgColor: '#f3eee3',
    textPrimary: '#1f1d1a',
    textSecondary: '#5b564d',
    accent: '#c23b30',
    onAccent: '#ffffff',
    border: '#ddd5c4',
    cardBg: '#ebe4d5',
    ink: '#1f1d1a',
    paper: '#fbf8f1',
  },
};

// Cores da cena por estação: primavera, verão, outono, inverno.
// mountains = [perto, meio, longe]
export const SEASONS = {
  night: [
    { sky: '#2d3266', fog: '#3b4180', mountains: ['#05061a', '#20244f', '#4a5090'] },
    { sky: '#1a3d45', fog: '#25525c', mountains: ['#030b0e', '#143840', '#2d6570'] },
    { sky: '#3d2a44', fog: '#553a5c', mountains: ['#0a040c', '#331d38', '#66407a'] },
    { sky: '#2a364d', fog: '#3a4a68', mountains: ['#050810', '#1f2b3f', '#4a5f82'] },
  ],
  day: [
    { sky: '#f6e7e4', fog: '#f1dcdc', mountains: ['#a3809a', '#bf9fb6', '#dcc3d2'] },
    { sky: '#e3efe6', fog: '#d6e6dc', mountains: ['#5a9a7a', '#78ad92', '#a9cdb9'] },
    { sky: '#f4e3cf', fog: '#ecd3b8', mountains: ['#c47642', '#cf8f66', '#e3b791'] },
    { sky: '#eef1f4', fog: '#e2e7ec', mountains: ['#7a8aa0', '#93a2b5', '#b9c5d2'] },
  ],
};

// Elementos decorativos da cena (não ficam atrás de texto corrido)
export const SCENE_ACCENTS = {
  night: { petal: '#d99bb0', torii: '#8f2a23', toriiTop: '#0b0d14', celestial: '#f3ead2' },
  day: { petal: '#f0a8bd', torii: '#c23b30', toriiTop: '#1f1d1a', celestial: '#f7e3b5' },
};

// Aceita valores antigos salvos no localStorage ('dark'/'light')
export function normalizeTheme(value) {
  return value === 'day' || value === 'light' ? 'day' : 'night';
}
