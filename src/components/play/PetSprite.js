'use client';

// PNGs locais (sem a margem vazia; ver scripts/trim-pokemon.mjs), no tamanho natural vezes
// `scale`: cada forma fica maior que a anterior e os pixels continuam nítidos
export default function PetSprite({ pet, shiny = false, asleep = false, scale = 1, className = '' }) {
  const [w, h] = shiny ? pet.shinySize : pet.size;
  return (
    <img
      src={shiny ? pet.shinySprite : pet.sprite}
      className={`pet-sprite ${className}`.trim()}
      data-asleep={asleep || undefined}
      data-shiny={shiny || undefined}
      width={w}
      height={h}
      style={{ width: Math.round(w * scale), height: Math.round(h * scale) }}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
