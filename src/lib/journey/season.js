// Progresso do scroll → estação (四季) e interpolação de cores da cena

export const SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter'];

// Ponto fixo da montanha nas rotas fora da jornada (outono)
export const FROZEN_PROGRESS = 0.7;

export function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function seasonMixFromProgress(progress) {
  return clamp01(progress) * (SEASON_NAMES.length - 1);
}

export function seasonNameFromMix(mix) {
  const index = Math.round(Math.min(Math.max(mix, 0), SEASON_NAMES.length - 1));
  return SEASON_NAMES[index];
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

export function lerpHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((c, i) => Math.round(c + (cb[i] - c) * t)));
}

export function sampleSeason(seasons, mix) {
  const m = Math.min(Math.max(mix, 0), seasons.length - 1);
  const i = Math.min(Math.floor(m), seasons.length - 2);
  const t = m - i;
  const a = seasons[i];
  const b = seasons[i + 1];
  if (t === 0) return a;
  if (t === 1) return b;
  return {
    sky: lerpHex(a.sky, b.sky, t),
    fog: lerpHex(a.fog, b.fog, t),
    mountains: a.mountains.map((c, k) => lerpHex(c, b.mountains[k], t)),
  };
}
