// Iniciais de Kanto, Hoenn e Kalos. O id salvo é a forma atual; a família identifica o inicial.
import SIZES from './pokemon-sizes.js';
import SHINY_SIZES from './pokemon-shiny-sizes.js';

// Os três tipos dos iniciais, com o nome japonês e a cor do cartão no menu
export const PET_TYPES = {
  grass: { jp: 'くさ', name: { pt: 'Planta', en: 'Grass' }, color: '#5bb26a' },
  fire: { jp: 'ほのお', name: { pt: 'Fogo', en: 'Fire' }, color: '#ec6a3c' },
  water: { jp: 'みず', name: { pt: 'Água', en: 'Water' }, color: '#4b93e6' },
};
export const GENERATIONS = [
  { id: 1, region: 'Kanto' }, { id: 3, region: 'Hoenn' }, { id: 6, region: 'Kalos' },
];
const FAMILIES = [
  [1, 'grass', 1, ['Bulbasaur', 'Ivysaur', 'Venusaur']],
  [1, 'fire', 4, ['Charmander', 'Charmeleon', 'Charizard']],
  [1, 'water', 7, ['Squirtle', 'Wartortle', 'Blastoise']],
  [3, 'grass', 252, ['Treecko', 'Grovyle', 'Sceptile']],
  [3, 'fire', 255, ['Torchic', 'Combusken', 'Blaziken']],
  [3, 'water', 258, ['Mudkip', 'Marshtomp', 'Swampert']],
  [6, 'grass', 650, ['Chespin', 'Quilladin', 'Chesnaught']],
  [6, 'fire', 653, ['Fennekin', 'Braixen', 'Delphox']],
  [6, 'water', 656, ['Froakie', 'Frogadier', 'Greninja']],
];
export const PETS = FAMILIES.flatMap(([generation, type, dex, names]) => names.map((name, stage) => ({
  id: name.toLowerCase(), name: { pt: name, en: name }, dex: dex + stage,
  generation, type, stage, starter: names[0].toLowerCase(),
  sprite: `/images/pokemon/${dex + stage}.png`,
  shinySprite: `/images/pokemon/shiny/${dex + stage}.png`,
  // Tamanho do sprite já sem a margem (px): cada forma maior que a anterior, como no jogo
  size: SIZES[dex + stage] ?? [64, 64],
  shinySize: SHINY_SIZES[dex + stage] ?? SIZES[dex + stage] ?? [64, 64],
})));
export const PET_STARTERS = PETS.filter((pet) => pet.stage === 0);
export const PET_IDS = PETS.map((pet) => pet.id);
export const PETS_KEY = 'oku-pets';
export const PET_SHINY_KEY = 'oku-pet-shiny';
export const MAX_PETS = 1;
export const petById = (id) => PETS.find((pet) => pet.id === id);
export const petFamily = (id) => PETS.filter((pet) => pet.starter === petById(id)?.starter);

export function readPets(storage) {
  try {
    const raw = JSON.parse(storage.getItem(PETS_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((id) => PET_IDS.includes(id)).slice(0, MAX_PETS) : [];
  } catch {
    return [];
  }
}
export function savePets(storage, ids) {
  try {
    storage.setItem(PETS_KEY, JSON.stringify(ids.filter((id) => PET_IDS.includes(id)).slice(0, MAX_PETS)));
  } catch {
    // Storage bloqueado: a escolha só vale nesta visita.
  }
}
// Shiny: cada inicial escolhido tem 1 chance em SHINY_ODDS de vir com as cores raras, e as formas
// evoluídas herdam. Nos jogos atuais é 1 em 4.096 (1 em 8.192 até a 5ª geração), raro demais para
// uma visita ao portfólio; aqui é 1 em 20, isto é, 5% por escolha
export const SHINY_ODDS = 20;
export const SHINY_RATE = 1 / SHINY_ODDS;
export const rollShiny = (rand = Math.random) => rand() < SHINY_RATE;
// Chance de ver ao menos um shiny em `tries` escolhas: 1 - (1 - 5%)^tries
export const shinyChanceIn = (tries) => 1 - (1 - SHINY_RATE) ** tries;
// Escolhas até a chance de ter visto um passar de `goal` (metade, por padrão): 14 para 50%
export const triesFor = (goal = 0.5) => Math.ceil(Math.log(1 - goal) / Math.log(1 - SHINY_RATE));

export function readPetShiny(storage) {
  try { return storage.getItem(PET_SHINY_KEY) === 'on'; } catch { return false; }
}
export function savePetShiny(storage, shiny) {
  try { storage.setItem(PET_SHINY_KEY, shiny ? 'on' : 'off'); } catch { /* Vale nesta visita. */ }
}
// Clicar no inicial da família atual retira o companheiro.
export function togglePet(ids, id) {
  if (!PET_STARTERS.some((pet) => pet.id === id)) return ids;
  return petById(ids[0])?.starter === id ? [] : [id];
}
// Nunca regride. Festival e modo foto movem a câmera, mas não contam como caminhada.
export function evolvedPet(id, { section, progress, route = 'journey', festival = false, photo = false, projectsOpen = false }) {
  const pet = petById(id);
  if (!pet || festival || photo) return pet;
  const stage = projectsOpen ? 1 : route !== 'journey' ? 0
    : section === 'contato' || progress >= 0.99 ? 2
      : section === 'projects' || section === 'experience' ? 1 : 0;
  return petFamily(id)[Math.max(pet.stage, stage)];
}
