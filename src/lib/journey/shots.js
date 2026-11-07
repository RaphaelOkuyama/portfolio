// Planos de câmera (enquadramentos) por trecho da jornada: rotações aplicadas por cima do olhar ao
// longo da curva (JourneyCamera). Funções puras, sem three, testadas em tests/unit/shots.test.js
import { smoothstep } from './math';

// Hero nas telas deitadas: a câmera gira para a esquerda e o torii vai para o terço direito (o
// texto fica à esquerda). O giro é fixo para qualquer proporção deitada: com o FOV vertical fixo, a
// imagem de cada proporção é um recorte central da mesma cena, e o quadro-pôster (scripts/poster.mjs)
// coincide com a cena em qualquer tela. Em pé (celular) não gira: o torii fica no meio, acima do texto
export const HERO_SHOT = { yaw: 0.32, pitch: 0.02 };

// Um plano por seção: o olhar varia ao longo dela (de `from` a `to`, pela fração da seção) e entra e
// sai suavemente nas bordas. Valores em radianos, pequenos: é a câmera na mão, não um giro
export const SECTION_SHOTS = {
  // Bambuzal: o olhar passeia de um lado a outro entre os colmos
  about: { from: { yaw: 0.07, pitch: 0.0, roll: -0.012 }, to: { yaw: -0.06, pitch: 0.01, roll: 0.01 } },
  // Clareira do Tanabata: olha para baixo, para o jardim e as tiras de papel
  stack: { from: { yaw: -0.02, pitch: -0.09, roll: 0 }, to: { yaw: 0.03, pitch: -0.13, roll: 0 } },
  // Emakimono: travelling lateral acompanhando o rolo que corre na horizontal
  projects: { from: { yaw: 0.1, pitch: -0.02, roll: 0 }, to: { yaw: -0.1, pitch: -0.02, roll: 0 } },
  // Experiência: ergue o olhar para o pagode do outro lado do rio
  experience: { from: { yaw: -0.03, pitch: 0.05, roll: 0.01 }, to: { yaw: 0.04, pitch: 0.07, roll: -0.008 } },
  // Contato: plano aberto descendo para o rio das lanternas
  contato: { from: { yaw: 0.02, pitch: -0.06, roll: 0 }, to: { yaw: -0.02, pitch: -0.11, roll: 0 } },
};
const EDGE = 0.035;

// `crossAt`: progresso em que a câmera cruza o torii (ver cameraMap). `ranges`: faixa de cada seção
// em fração do progresso (sectionRanges da store)
export function cameraShot(progress, { crossAt, aspect, ranges = {} }) {
  const wide = aspect >= 1 ? 1 : 0;
  const settle = 1 - smoothstep(0, Math.max(0.01, crossAt * 0.8), progress);
  const shot = { yaw: HERO_SHOT.yaw * wide * settle, pitch: HERO_SHOT.pitch * wide * settle, roll: 0 };
  for (const [id, { from, to }] of Object.entries(SECTION_SHOTS)) {
    const range = ranges[id];
    if (!range) continue;
    const [a, b] = range;
    const weight = smoothstep(a - EDGE, a + EDGE, progress) * (1 - smoothstep(b - EDGE, b + EDGE, progress));
    if (weight <= 0) continue;
    const local = smoothstep(a, b, progress);
    shot.yaw += (from.yaw + (to.yaw - from.yaw) * local) * weight;
    shot.pitch += (from.pitch + (to.pitch - from.pitch) * local) * weight;
    shot.roll += (from.roll + (to.roll - from.roll) * local) * weight;
  }
  return shot;
}

// Respiro de nanquim: nas viradas de capítulo a borda da tela escurece e volta (0–1)
export function inkBreath(progress, ranges = {}) {
  let ink = 0;
  for (const id of ['about', 'stack', 'projects', 'experience', 'contato']) {
    const start = ranges[id]?.[0];
    if (start === undefined || start <= 0.02) continue;
    const d = Math.abs(progress - start) / 0.03;
    ink = Math.max(ink, Math.max(0, 1 - d * d));
  }
  return ink;
}
