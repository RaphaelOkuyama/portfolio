'use client';
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { journeyStore } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { sceneLight, MAX_POOLS } from './lightRig';
import { lanternSpots } from './ShrineProps';
import { CELESTIAL, FESTIVAL, GROUND, STONE_LANTERNS } from './config';

// Contorno do luar e poças das lanternas por tema. À noite o contraluz frio da lua e as lanternas
// acesas; de dia um contorno quente e fraco, lanternas apagadas
const LOOK = {
  night: { rim: '#b4c0ff', rimStrength: 1.5, pool: '#ffb85a', poolStrength: 1.35 },
  day: { rim: '#fff0d2', rimStrength: 0.2, pool: '#ffb85a', poolStrength: 0 },
};
// Altura da janela acesa (火袋) acima do chão e o alcance da luz
const LANTERN_HEIGHT = 1.45 * STONE_LANTERNS.scale;
const LANTERN_REACH = 6.5;

export function lightPools() {
  const lanterns = lanternSpots().map(({ position: [x, y, z] }) => [x, y + LANTERN_HEIGHT, z, LANTERN_REACH]);
  // Os chōchin da barraca de máscaras
  const { x, z } = FESTIVAL.stall;
  const stall = [x, groundHeight(x, z, GROUND) + 2.2, z, 3];
  return [stall, ...lanterns].slice(0, MAX_POOLS);
}

export default function SceneLight() {
  const pools = useMemo(lightPools, []);
  const target = useMemo(() => ({ rim: new Color(), pool: new Color(), init: false }), []);

  useMemo(() => {
    const [x, y, z] = CELESTIAL.position;
    sceneLight.uMoonDir.value.set(x, y, z).normalize();
    pools.forEach((p, i) => sceneLight.uPools.value[i].set(...p));
  }, [pools]);

  useFrame((state, delta) => {
    const { theme, lite } = journeyStore.getState();
    const look = LOOK[theme] ?? LOOK.night;
    const k = target.init ? 1 - Math.exp(-delta * 3) : 1;
    target.init = true;
    target.rim.set(look.rim);
    target.pool.set(look.pool);
    sceneLight.uRimColor.value.lerp(target.rim, k);
    sceneLight.uPoolColor.value.lerp(target.pool, k);
    const rim = sceneLight.uRimStrength;
    const pool = sceneLight.uPoolStrength;
    rim.value += (look.rimStrength - rim.value) * k;
    pool.value += (look.poolStrength - pool.value) * k;
    // Sem GPU: só o contorno (o laço das poças por pixel pesa no desenho por software)
    sceneLight.uPoolCount.value = lite ? 0 : pools.length;
    if (Math.abs(look.rimStrength - rim.value) + Math.abs(look.poolStrength - pool.value) > 0.002) state.invalidate();
  });

  return null;
}
