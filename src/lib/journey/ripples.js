// 波紋: ondas na água do rio. Quem respinga (as gotas da katana) chama addRipple em coordenadas
// do mundo; o River converte para o plano dele e desenha os anéis abrindo. Buffer circular fixo
export const MAX_RIPPLES = 16;
// Quanto tempo um anel vive (s) e a que velocidade ele abre (unidades/s)
export const RIPPLE = { life: 2.6, speed: 1.5 };

export const ripples = {
  items: Array.from({ length: MAX_RIPPLES }, () => ({ x: 0, z: 0, at: -Infinity, strength: 0 })),
  next: 0,
};

export function addRipple(x, z, strength, now, store = ripples) {
  const slot = store.items[store.next];
  Object.assign(slot, { x, z, at: now, strength });
  store.next = (store.next + 1) % store.items.length;
  return slot;
}

// Idade de um anel (s), ou null se já sumiu (ou ainda não nasceu)
export function rippleAge(item, now) {
  const age = now - item.at;
  return age >= 0 && age <= RIPPLE.life ? age : null;
}

// Algum anel ainda vivo? (a cena continua pedindo quadros enquanto houver)
export const anyRipple = (now, store = ripples) => store.items.some((r) => rippleAge(r, now) !== null);
