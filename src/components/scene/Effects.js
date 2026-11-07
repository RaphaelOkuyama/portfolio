'use client';
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, GodRays, SMAA } from '@react-three/postprocessing';
import { Color } from 'three';
import { journeyStore, useJourney, effectiveProgress } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { SCENE_ACCENTS } from '../../lib/palette';
import { smoothstep } from '../../lib/journey/math';
import { transitionPhase } from '../../lib/journey/skyTransition';
import { celestialWorld } from './Celestial';
import { CELESTIAL } from './config';
import Grade from './Grade';

// Fonte dos raios de luz: um disco atrás da lua (o disco pintado da lua fica por cima dele). Os
// raios passam pelo torii e pelos bambus no hero; depois a lua some e o disco apaga
function RaysSource({ onReady }) {
  const color = useMemo(() => new Color(), []);
  const level = useRef(1);
  useFrame((state, delta) => {
    const mesh = state.scene.getObjectByName('rays-source');
    if (!mesh) return;
    const store = journeyStore.getState();
    const { theme } = store;
    // Na troca de tema o astro desce atrás das montanhas e o outro sobe: a fonte dos raios não é
    // mascarada pela cena e passava na frente do torii. Ela se apaga logo no começo da troca e volta
    // devagar com o astro novo já no lugar
    const calm = transitionPhase(performance.now() / 1000) === null ? 1 : 0;
    level.current += (calm - level.current) * (1 - Math.exp(-delta * (calm ? 3 : 14)));
    if (Math.abs(calm - level.current) > 0.005) state.invalidate();
    // Some fora do hero e quando a lua vira o olho do Tsukuyomi (o disco apareceria por trás dele)
    const hero = (store.tsukuyomi ? 0 : 1 - smoothstep(0.06, 0.16, effectiveProgress(store))) * level.current;
    // Um pouco atrás da lua, sempre de frente para a câmera
    mesh.position.copy(celestialWorld).sub(state.camera.position).setLength(0.6).add(celestialWorld);
    mesh.lookAt(state.camera.position);
    color.set(SCENE_ACCENTS[theme].celestial).multiplyScalar(theme === 'night' ? 0.95 * hero : 0.7 * hero);
    mesh.material.color.copy(color);
    mesh.visible = hero > 0.01;
  });
  return (
    <mesh name="rays-source" ref={onReady}>
      <circleGeometry args={[CELESTIAL.radius * 0.82, 48]} />
      <meshBasicMaterial transparent depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

// Pós-processamento: gradação de cor (vinheta, grão, luzes altas) no médio e no alto; no alto,
// também o brilho das lanternas (bloom) e os raios do luar. SMAA no lugar do antialias do canvas
export default function Effects() {
  const quality = useJourney((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];
  const [sun, setSun] = useState(null);
  if (!settings?.grade) return null;
  const rays = settings.postprocessing;

  return (
    <>
      {rays ? <RaysSource onReady={setSun} /> : null}
      <EffectComposer multisampling={0}>
        {rays ? <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1.1} /> : null}
        {rays && sun ? (
          <GodRays sun={sun} samples={48} density={0.94} decay={0.93} weight={0.42} exposure={0.32} clampMax={1} blur />
        ) : null}
        <Grade />
        <SMAA />
      </EffectComposer>
    </>
  );
}
