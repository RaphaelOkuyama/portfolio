'use client';
import { useEffect, useRef } from 'react';
import { PET_SIZE, petPixels } from '../../lib/pets';

// O bicho desenhado num canvas pequeno (a grade de 12x12 em dobro), ampliado pelo CSS sem suavizar (pixels inteiros)
export default function PetSprite({ pet, asleep = false, size = 48 }) {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.clearRect(0, 0, PET_SIZE * 2, PET_SIZE * 2);
    petPixels(pet, { asleep }).forEach(([x, y, color, half]) => {
      ctx.fillStyle = color;
      // O canvas tem o dobro da grade: o traço do olho fechado ocupa meia altura de pixel
      if (half) ctx.fillRect(x * 2, y * 2 + 1, 2, 1);
      else ctx.fillRect(x * 2, y * 2, 2, 2);
    });
  }, [pet, asleep]);
  return <canvas ref={ref} className="pet-sprite" width={PET_SIZE * 2} height={PET_SIZE * 2} style={{ width: size, height: size }} aria-hidden="true" />;
}
