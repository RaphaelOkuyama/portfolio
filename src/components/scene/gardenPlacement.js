'use client';
import { useJourney } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { GARDEN, GROUND } from './config';

// Jardim zen fixo no chão do vale, no meio da clareira (mesmo lugar em qualquer tela).
// Compartilhado pelo chão (que pinta a areia) e pelas pedras
const CENTER = [0, groundHeight(0, GARDEN.z, GROUND), GARDEN.z];

export function useGardenPlacement() {
  // A faixa do Stack só controla os vaga-lumes (aparecem enquanto a seção está na tela)
  const range = useJourney((s) => s.sectionRanges.stack) ?? GARDEN.fallbackRange;
  return { center: CENTER, range };
}
