'use client';
import { useEffect, useRef } from 'react';
import { journeyStore } from '../../store/journey';
import { inkBreath } from '../../lib/journey/shots';

// 墨の息: na virada de cada capítulo a tinta avança pelas bordas da tela e recua, como um corte de
// cena feito a pincel. Fica entre a cena e o conteúdo (o texto nunca escurece) e segue a rolagem
export default function InkBreath() {
  const ref = useRef(null);
  useEffect(() => {
    const apply = (state) => {
      if (!ref.current) return;
      const ink = state.reducedMotion || state.route !== 'journey' ? 0 : inkBreath(state.progress, state.sectionRanges);
      ref.current.style.opacity = ink.toFixed(3);
    };
    apply(journeyStore.getState());
    return journeyStore.subscribe((state, prev) => {
      if (state.progress !== prev.progress || state.sectionRanges !== prev.sectionRanges) apply(state);
    });
  }, []);
  return <div ref={ref} className="ink-breath" aria-hidden="true" />;
}
