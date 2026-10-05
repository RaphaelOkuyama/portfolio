'use client';
import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { journeyStore } from '../../store/journey';

// Sem rolagem, mouse, toque ou teclado por este tempo, a cena passa a 30 quadros por segundo
export const IDLE_AFTER_MS = 2000;
export const IDLE_FPS = 30;

const ACTIVITY = ['scroll', 'wheel', 'pointermove', 'pointerdown', 'touchstart', 'keydown'];

// true depois de IDLE_AFTER_MS sem interação. Só muda de estado nas transições (não re-renderiza
// a cada evento de rolagem)
export function useSceneIdle() {
  const [idle, setIdle] = useState(false);
  const idleRef = useRef(false);

  useEffect(() => {
    let timer = null;
    const wake = () => {
      if (idleRef.current) {
        idleRef.current = false;
        setIdle(false);
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        idleRef.current = true;
        setIdle(true);
      }, IDLE_AFTER_MS);
    };
    wake();
    ACTIVITY.forEach((type) => window.addEventListener(type, wake, { passive: true }));
    // Lanterna solta pelo formulário, troca de tema ou de pedra: animações que merecem 60 fps
    const unsubscribe = journeyStore.subscribe((state, prev) => {
      if (state.lanternReleases !== prev.lanternReleases || state.theme !== prev.theme || state.activeStone !== prev.activeStone) wake();
    });
    return () => {
      clearTimeout(timer);
      ACTIVITY.forEach((type) => window.removeEventListener(type, wake));
      unsubscribe();
    };
  }, []);

  return idle;
}

// Com o frameloop em "demand", pede um quadro a cada 1/30 s (pétalas, água e névoa seguem vivas
// pela metade do custo de GPU e bateria). O tempo das animações vem do delta: nada anda mais devagar
export function HalfRateFrames() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let id = 0;
    let last = 0;
    const step = 1000 / IDLE_FPS - 4;
    const loop = (t) => {
      if (t - last >= step) {
        last = t;
        invalidate();
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [invalidate]);
  return null;
}
