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
    { sky: '#1c1f3a', fog: '#2b2c4d', mountains: ['#0f1124', '#1f2140', '#34365c'] },
    { sky: '#0f2226', fog: '#1a3336', mountains: ['#08161a', '#12272b', '#21393d'] },
    { sky: '#241826', fog: '#352434', mountains: ['#150d16', '#281a28', '#3f2b3d'] },
    { sky: '#161d2b', fog: '#26303f', mountains: ['#0b1019', '#1a2230', '#2f3a4b'] },
  ],
  day: [
    { sky: '#f6e7e4', fog: '#f1dcdc', mountains: ['#6b6f86', '#9a9cb3', '#c8c6d6'] },
    { sky: '#e3efe6', fog: '#d6e6dc', mountains: ['#2f5a4a', '#5f8a76', '#a3c2b0'] },
    { sky: '#f4e3cf', fog: '#ecd3b8', mountains: ['#7a3b2a', '#a8674a', '#d3a684'] },
    { sky: '#eef1f4', fog: '#e2e7ec', mountains: ['#4a5563', '#7f8a98', '#b9c2cc'] },
  ],
};

// Aceita valores antigos salvos no localStorage ('dark'/'light')
export function normalizeTheme(value) {
  return value === 'day' || value === 'light' ? 'day' : 'night';
}
