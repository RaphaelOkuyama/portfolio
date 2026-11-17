// 遊: os extras do menu de brincadeiras (modo Famicom, modo foto, bichinhos). Aqui fica o estado
// que não é do React: a música, a câmera livre do modo foto e a escolha salva dos bichinhos
import { journeyStore } from '../store/journey';
import { petById, readPets, rollShiny, savePets, togglePet, readPetShiny, savePetShiny } from './pets';
import { unlockEvolutionSound } from './sound/pokemon';

let tune = null;

// ファミコン: liga a tela de poucos pixels e a música (o clique que liga é o gesto que o
// navegador exige para tocar som)
const MUSIC_KEY = 'retro-music';

async function syncTune() {
  const wanted = () => journeyStore.getState().retro && journeyStore.getState().retroMusic;
  if (!wanted()) {
    tune?.stop();
    tune = null;
    return;
  }
  if (tune) return;
  const { createChiptune } = await import('./retro');
  // Desligou enquanto o código da música baixava (ou outra chamada já ligou)
  if (wanted() && !tune) tune = createChiptune();
}

export async function setRetro(on) {
  let music = true;
  try {
    music = window.localStorage.getItem(MUSIC_KEY) !== 'off';
  } catch {
    music = true;
  }
  journeyStore.setState({ retro: on, retroMusic: music });
  document.documentElement.classList.toggle('retro', on);
  await syncTune();
}

// A música do Famicom liga e desliga à parte (a escolha fica salva): os pixels continuam
export async function setRetroMusic(on) {
  journeyStore.setState({ retroMusic: on });
  try {
    window.localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off');
  } catch {
    // Storage bloqueado: a escolha só não persiste
  }
  await syncTune();
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
  try {
    journeyStore.setState({ pets: readPets(window.localStorage), petShiny: readPetShiny(window.localStorage) });
  } catch {
    // O próprio acesso a localStorage pode ser bloqueado pelo navegador.
  }
}

// Um inicial novo sorteia se vem shiny (as evoluções herdam); retirar o companheiro apaga. Quando o
// sorteio dá shiny, avisa o bichinho para comemorar ('oku:pet-shiny')
export function switchPet(id, rand = Math.random) {
  unlockEvolutionSound();
  const state = journeyStore.getState();
  const next = togglePet(state.pets, id);
  const fresh = next.length > 0 && petById(next[0])?.starter !== petById(state.pets[0])?.starter;
  const shiny = next.length === 0 ? false : fresh ? rollShiny(rand) : state.petShiny;
  journeyStore.setState({ pets: next, petShiny: shiny });
  try {
    savePets(window.localStorage, next);
    savePetShiny(window.localStorage, shiny);
  } catch { /* Vale nesta visita. */ }
  if (fresh && shiny) window.dispatchEvent(new CustomEvent('oku:pet-shiny'));
  return shiny;
}
