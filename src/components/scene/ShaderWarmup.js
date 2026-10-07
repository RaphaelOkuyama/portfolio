'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useJourney } from '../../store/journey';
import { warm } from './warmup';

// Compila todos os shaders da cena antes do primeiro quadro, em paralelo na GPU
// (KHR_parallel_shader_compile): sem isso o three compila na hora de desenhar e a thread
// principal trava esperando cada programa (~2s num celular). Objetos ainda escondidos (rio,
// pássaros, folhas, lanternas) entram também, para não compilarem no meio da rolagem
export default function ShaderWarmup({ onReady }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    let cancelled = false;
    warm(gl, scene, camera).then(() => {
      if (!cancelled) onReady();
    });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onReady]);

  return null;
}

// Depois da cena pronta: o que nasce mais tarde (materiais refeitos ao trocar a qualidade, peças
// montadas sob demanda) também compila em segundo plano, quando o navegador está ocioso
export function LateWarmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const quality = useJourney((s) => s.quality);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 200));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    // Espera o React aplicar os materiais novos e o navegador sossegar
    const id = idle(() => warm(gl, scene, camera), { timeout: 1500 });
    return () => cancel(id);
  }, [gl, scene, camera, quality]);

  return null;
}
