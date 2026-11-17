'use client';
import { useEffect } from 'react';
import { addAfterEffect, useThree } from '@react-three/fiber';

// 写真: salva o quadro da cena como PNG. O canvas não guarda o desenho entre quadros, então a
// cópia é feita logo depois de um quadro terminar (pós-processamento incluído), na mesma tarefa
export default function PhotoShot() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let pending = false;
    const stop = addAfterEffect(() => {
      if (!pending) return;
      pending = false;
      gl.domElement.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `okuyama-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        window.dispatchEvent(new Event('oku:photo-saved'));
      }, 'image/png');
    });
    const onShot = () => {
      pending = true;
      invalidate();
    };
    window.addEventListener('oku:photo-shot', onShot);
    return () => {
      stop();
      window.removeEventListener('oku:photo-shot', onShot);
    };
  }, [gl, invalidate]);
  return null;
}
