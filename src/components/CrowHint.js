'use client';
import { useEffect, useState } from 'react';
import { isUiTarget } from '../lib/journey/sceneClick';
import { CROW_CAW, crowHint, hitsCrow } from '../lib/crow';

// O balão do 八咫烏: clicado, o corvo pousado no torii grasna (カァ) e dá uma dica de um easter
// egg, perto de onde foi o clique. Cada clique traz a próxima dica. Some sozinho
export default function CrowHint() {
  const [bubble, setBubble] = useState(null);

  useEffect(() => {
    let index = 0;
    let timer = 0;
    const onClick = (e) => {
      if (e.button !== 0 || isUiTarget(e.target) || !hitsCrow(e.clientX, e.clientY)) return;
      const lang = document.documentElement.getAttribute('data-language') === 'en' ? 'en' : 'pt';
      window.dispatchEvent(new CustomEvent(CROW_CAW));
      clearTimeout(timer);
      // Acima do clique, sem passar das bordas da tela
      const x = Math.min(window.innerWidth - 170, Math.max(170, e.clientX));
      // Bem acima do clique: o corvo fica à vista embaixo do balão
      const y = Math.max(150, e.clientY - 80);
      setBubble({ key: performance.now(), x, y, text: crowHint(lang, index) });
      index += 1;
      timer = setTimeout(() => setBubble(null), 7000);
    };
    // Captura: decide antes do omikuji do torii (que fica logo atrás do corvo)
    window.addEventListener('click', onClick, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', onClick, true);
    };
  }, []);

  if (!bubble) return null;
  return (
    <div key={bubble.key} className="crow-bubble" role="status" style={{ left: bubble.x, top: bubble.y }}>
      <span className="crow-bubble-caw font-jp" lang="ja" aria-hidden="true">カァ</span>
      <p className="crow-bubble-text">{bubble.text}</p>
    </div>
  );
}
