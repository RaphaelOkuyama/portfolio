// 花火大会: a ponte entre o jogo de taiko (DOM) e a cena 3D. Com a cena de verdade na tela, o
// festival leva a câmera para a beira do rio e os fogos estouram no céu atrás da ponte (ver
// scene/Fireworks); o jogo só pede os fogos por aqui. Sem cena 3D, o jogo desenha os fogos ele
// mesmo, por cima da página
import { journeyStore } from '../store/journey';

export const FESTIVAL = {
  // Onde a câmera para: sobre a água, de frente para a taikobashi, olhando o céu atrás dela
  camera: { position: [0, 2.4, -58], lookAt: [0, 13.5, -116] },
  // Duração do voo até lá (s)
  flight: 1.9,
  // Onde os fogos estouram (mundo): atrás da ponte (z = -96), do pagode (z = -118) e da primeira
  // cordilheira do fundo (z = -120), que esconde o pé deles. Altura acima da água; a largura se
  // ajusta ao que a câmera enxerga
  zone: { z: [-128, -121], y: [17, 31], halfX: 31 },
  // Tempo de subida da casca até estourar (s)
  rise: { hit: 0.7, finale: 1.05 },
};

// Estado que a cena lê a cada quadro (fora do React): pedidos de fogos, clarões acesos (para o
// reflexo no rio) e o aviso de estouro (o som)
// `speed`: a que fração do tempo real as faíscas andam (o show de hanabi usa câmera lenta)
export const festival = { queue: [], glows: [], clock: 0, onBurst: null, speed: 1 };

// Pede um fogo. { big, finale, kind, x } (x de -1 a 1, da esquerda à direita do céu visível)
export function launchFirework(request = {}) {
  if (festival.queue.length < 60) festival.queue.push(request);
}

// ナイアガラ: a cortina de faíscas caindo da ponte, por `seconds`
export function launchNiagara(seconds = 5) {
  festival.queue.push({ kind: 'niagara', seconds });
}

// Só com a cena 3D de verdade na tela (pronta, com placa de vídeo) e nada cobrindo ela
export function canFestival() {
  const s = journeyStore.getState();
  return s.sceneReady && !s.lite && !s.photo && !s.covered && !s.lost && Boolean(document.querySelector('[data-scene="webgl"] canvas'));
}

// Liga o festival na cena: a página some, a câmera voa até o rio e a noite cai (os fogos não
// aparecem contra o céu do dia). Ao sair, tudo volta como estava. Devolve se a cena assumiu
export function setFestival(on) {
  const s = journeyStore.getState();
  if (on === s.festival) return on;
  if (on && !canFestival()) return false;
  festival.queue.length = 0;
  if (on) {
    if (s.theme !== 'night') s.setTheme('night');
  } else {
    // O tema escolhido continua no <html>: a cena volta para ele
    const chosen = document.documentElement.getAttribute('data-theme') === 'day' ? 'day' : 'night';
    if (s.theme !== chosen) s.setTheme(chosen);
  }
  s.setFestival(on);
  document.documentElement.classList.toggle('festival-mode', on);
  return on;
}
