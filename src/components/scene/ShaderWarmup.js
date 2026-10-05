'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

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
    const hidden = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    const restore = () => hidden.forEach((o) => { o.visible = false; });
    const done = () => {
      if (!cancelled) onReady();
    };
    gl.compileAsync(scene, camera).then(done, done);
    // compile() já criou os programas; a visibilidade original volta antes de qualquer quadro
    restore();
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onReady]);

  return null;
}
