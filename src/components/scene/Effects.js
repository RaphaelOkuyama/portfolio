'use client';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';

// Pós-processamento só em qualidade alta: bloom nas lanternas (cores > 1)
export default function Effects() {
  const quality = useJourney((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];
  if (!settings?.postprocessing) return null;

  return (
    <EffectComposer multisampling={settings.multisampling ?? 0}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1.1} />
    </EffectComposer>
  );
}
