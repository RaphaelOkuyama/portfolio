// 遊: os extras do menu de brincadeiras (modo Famicom, modo foto, bichinhos). Aqui fica o estado
// que não é do React: a música, a câmera livre do modo foto e a escolha salva dos bichinhos
import { journeyStore } from '../store/journey';
import { readPets, savePets, togglePet } from './pets';

let tune = null;

// ファミコン: liga a tela de poucos pixels e a música (o clique que liga é o gesto que o
// navegador exige para tocar som)
export async function setRetro(on) {
  journeyStore.setState({ retro: on });
  document.documentElement.classList.toggle('retro', on);
  tune?.stop();
  tune = null;
  if (on) {
    const { createChiptune } = await import('./retro');
    // Desligou enquanto o código da música baixava
    if (journeyStore.getState().retro) tune = createChiptune();
  }
}

// 写真: câmera livre do modo foto, somada ao ponto da trilha em que a pessoa está (ver
// JourneyCamera). Ângulos em radianos, deslocamentos em unidades da cena
export const PHOTO_LIMITS = { yaw: 1.4, pitch: 0.6, dolly: [-6, 14], truck: 6, lift: [-0.4, 8] };
export const photoRig = { yaw: 0, pitch: 0, dolly: 0, truck: 0, lift: 0 };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function movePhoto({ yaw = 0, pitch = 0, dolly = 0, truck = 0, lift = 0 }) {
  photoRig.yaw = clamp(photoRig.yaw + yaw, -PHOTO_LIMITS.yaw, PHOTO_LIMITS.yaw);
  photoRig.pitch = clamp(photoRig.pitch + pitch, -PHOTO_LIMITS.pitch, PHOTO_LIMITS.pitch);
  photoRig.dolly = clamp(photoRig.dolly + dolly, ...PHOTO_LIMITS.dolly);
  photoRig.truck = clamp(photoRig.truck + truck, -PHOTO_LIMITS.truck, PHOTO_LIMITS.truck);
  photoRig.lift = clamp(photoRig.lift + lift, ...PHOTO_LIMITS.lift);
}

export function resetPhoto() {
  Object.assign(photoRig, { yaw: 0, pitch: 0, dolly: 0, truck: 0, lift: 0 });
}

// Só existe o que fotografar com a cena 3D de verdade na tela, na home
export function canPhoto() {
  const s = journeyStore.getState();
  return s.route === 'journey' && s.sceneReady && !s.lite && Boolean(document.querySelector('[data-scene="webgl"] canvas'));
}

export function setPhoto(on) {
  if (on && !canPhoto()) return false;
  resetPhoto();
  journeyStore.setState({ photo: on });
  document.documentElement.classList.toggle('photo-mode', on);
  return true;
}

// 育: bichinhos escolhidos (um ou vários), guardados para a próxima visita
export function loadPets() {
  journeyStore.setState({ pets: readPets(window.localStorage) });
}

export function switchPet(id) {
  const next = togglePet(journeyStore.getState().pets, id);
  journeyStore.setState({ pets: next });
  savePets(window.localStorage, next);
}
