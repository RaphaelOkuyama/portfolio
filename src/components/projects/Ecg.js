'use client';
import { useEffect, useRef } from 'react';

// IMACARDIOS é um produto privado (sem prints públicos): no lugar da foto, um traço de ECG a pincel.
// No rolo da home ele é a "imagem" do painel; na página do projeto o mesmo traço entra pelas clínicas
// e vira o diagrama do isolamento de dados em duas camadas
const BEAT = 'l18 0 q6 -8 12 0 l8 0 l4 6 l6 -46 l6 60 l4 -20 l12 0 q10 -14 20 0 l10 0';

// Três batimentos seguidos, começando em (x, y)
const ecgPath = (x, y, beats = 3) => `M${x} ${y} ${Array.from({ length: beats }, () => BEAT).join(' ')}`;

export function EcgMark() {
  return (
    <svg className="ecg-mark" viewBox="0 0 320 90" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <path className="ecg-wash" d={ecgPath(10, 50)} pathLength="1" />
      <path className="ecg-line" d={ecgPath(10, 50)} pathLength="1" />
      <circle className="ecg-dot" cx="310" cy="50" r="4" />
    </svg>
  );
}

// Diagrama: o batimento chega às clínicas, passa pela API (camada 1: cada consulta presa à clínica)
// e pelo Postgres (camada 2: regras por clínica no banco); CPF e diagnóstico ficam num banco à parte.
// Desenha quando entra na tela (classe is-drawn); com movimento reduzido já aparece pronto
export function EcgDiagram({ labels }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-drawn');
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.classList.add('is-drawn');
      io.disconnect();
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const clinics = [0, 1, 2];
  return (
    <figure ref={ref} className="ecg-diagram">
      <svg viewBox="0 0 680 330" role="img" aria-label={labels.alt}>
        <path className="ecg-wash" d={ecgPath(8, 46, 4)} pathLength="1" />
        <path className="ecg-line" d={ecgPath(8, 46, 4)} pathLength="1" />
        {clinics.map((i) => (
          <g key={i} className="ecg-node" style={{ '--d': `${0.9 + i * 0.12}s` }}>
            <rect x={60 + i * 200} y="96" width="160" height="44" rx="8" />
            <text x={140 + i * 200} y="124">{labels.clinic} {String.fromCharCode(65 + i)}</text>
            <path className="ecg-wire" d={`M${140 + i * 200} 140 L${140 + i * 200} 168`} pathLength="1" />
          </g>
        ))}
        <g className="ecg-node is-layer" style={{ '--d': '1.35s' }}>
          <rect x="60" y="168" width="560" height="44" rx="8" />
          <text x="340" y="196">{labels.app}</text>
          <path className="ecg-wire" d="M340 212 L340 240" pathLength="1" />
        </g>
        <g className="ecg-node is-layer" style={{ '--d': '1.6s' }}>
          <rect x="60" y="240" width="380" height="44" rx="8" />
          <text x="250" y="268">{labels.db}</text>
        </g>
        <g className="ecg-node is-vault" style={{ '--d': '1.85s' }}>
          <path className="ecg-wire is-dashed" d="M560 212 L560 240" pathLength="1" />
          <rect x="470" y="240" width="150" height="44" rx="8" />
          <text x="545" y="268">{labels.vault}</text>
        </g>
      </svg>
      <figcaption className="ecg-caption">{labels.caption}</figcaption>
    </figure>
  );
}
