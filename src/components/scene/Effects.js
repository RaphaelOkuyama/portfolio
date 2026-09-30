'use client';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';

// Pós-processamento só em qualidade alta: bloom nas lanternas (cores > 1) + grão de filme
export default function Effects() {
  const quality = useJourney((s) => s.quality);
  if (!QUALITY_SETTINGS[quality]?.postprocessing) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1.1} />
      <Noise opacity={0.035} />
    </EffectComposer>
  );
}
