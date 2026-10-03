'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, MeshBasicMaterial } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';

// Materiais de uma peça da cena tingidos pela paleta, com o mesmo crossfade 昼/夜 do torii.
// `parts`: { nome: { accent, double?, glow? } } — `accent` é a chave em SCENE_ACCENTS;
// `glow` multiplica a cor (acima de 1 acende o bloom na qualidade alta) por tema
export function useAccentMaterials(parts) {
  const keys = Object.keys(parts);
  const materials = useMemo(
    () => Object.fromEntries(keys.map((k) => [k, new MeshBasicMaterial({
      vertexColors: true,
      side: parts[k].double ? DoubleSide : undefined,
      toneMapped: !parts[k].glow,
    })])),
    // As peças são fixas por componente
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const target = useMemo(() => new Color(), []);
  const initialized = useRef(false);

  useEffect(() => () => keys.forEach((k) => materials[k].dispose()), [materials]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, delta) => {
    const { theme } = journeyStore.getState();
    const accents = SCENE_ACCENTS[theme];
    // Primeiro frame aplica direto; depois acompanha o crossfade 昼/夜
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;
    let moving = false;
    for (const key of keys) {
      const { accent, glow } = parts[key];
      target.set(accents[accent]).multiplyScalar(glow ? glow[theme] : 1);
      const c = materials[key].color;
      c.lerp(target, k);
      if (Math.abs(c.r - target.r) + Math.abs(c.g - target.g) + Math.abs(c.b - target.b) > 0.002) moving = true;
    }
    if (moving) state.invalidate();
  });

  return materials;
}
