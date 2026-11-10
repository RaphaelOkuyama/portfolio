// Progresso do traço do ensō (0–1)
export const LOADER_MIN_MS = 1200;
// O ensō espera a cena 3D ficar pronta (shaders compilados): abrir antes travava a íris no meio,
// com a tela vazia, enquanto a GPU compilava. O máximo segura aparelhos lentos
export const LOADER_MAX_MS = 8000;
// Primeira visita na home: a página só rola com a cena pronta (o ensō pode sair antes, num clique
// para pular); passado este tempo, rola de qualquer jeito
export const SCENE_WAIT_MAX_MS = 15000;
// Abertura completa (desktop com mouse): só nela o ensō espera a cena e a home trava a rolagem. No
// celular a cena começa depois, no primeiro toque (ver SceneCanvas), e o pôster segura a hero
export const CINEMATIC_QUERY = '(pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)';

// Marca de quem já viu o ensō: na volta o loader não aparece (lido também pelo THEME_BOOT_SCRIPT)
export const VISITED_KEY = 'oku-visited';

// Enquanto espera, o traço avança até 90% no tempo mínimo.
// Fecha quando a cena está pronta (e o mínimo passou) ou no tempo máximo. O mínimo conta do
// começo do traço (a animação precisa desse tempo); o máximo conta da navegação (`waited`), que é
// a espera real de quem abriu a página: o overlay já está na tela desde o HTML do servidor, e
// no 4G o JS só chega ~3s depois. Contando do traço, a espera passava de 7s
export function loaderProgress({ elapsed, waited = elapsed, sceneReady, minMs = LOADER_MIN_MS, maxMs = LOADER_MAX_MS }) {
  if (waited >= maxMs) return 1;
  if (sceneReady && elapsed >= minMs) return 1;
  if (minMs === 0) return 0.9;
  return Math.min(0.9, (elapsed / minMs) * 0.9);
}

export function isReturningVisit() {
  return document.documentElement.hasAttribute('data-visited');
}

export function markVisited() {
  try {
    localStorage.setItem(VISITED_KEY, '1');
  } catch {
    // Storage bloqueado: o ensō só volta a aparecer na próxima visita
  }
}
