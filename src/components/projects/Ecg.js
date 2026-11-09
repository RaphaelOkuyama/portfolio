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

// Diagrama do caso: uma faixa por clínica desce do batimento, atravessa as duas camadas (a API e
// o Postgres) sem nunca cruzar com as outras, cada uma com a sua trava em cada camada; CPF e
// diagnóstico saem da API para um cofre à parte. HTML (e não um SVG inteiro): o texto mantém o
// tamanho legível no celular e as caixas crescem com ele. Desenha quando entra na tela (is-drawn);
// com movimento reduzido já aparece pronto
const LANES = ['A', 'B', 'C'];

function Lock() {
  return (
    <svg className="arch-lock-icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.6" />
      <path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" />
    </svg>
  );
}

function Layer({ layer, kind, lock }) {
  return (
    <div className={`arch-layer is-${kind}`}>
      <p className="arch-layer-head">
        <span className="arch-tag">{layer.tag}</span>
        <strong>{layer.name}</strong>
      </p>
      <p className="arch-layer-desc">{layer.desc}</p>
      <ul className="arch-locks" aria-hidden="true">
        {LANES.map((id) => (
          <li key={id} className={`arch-lock lane-${id.toLowerCase()}`}>
            <Lock /> {lock} {id}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure ref={ref} className="arch">
      <div className="arch-board" role="img" aria-label={labels.alt}>
        <svg className="arch-ecg" viewBox="0 0 620 70" preserveAspectRatio="none" aria-hidden="true">
          <path className="ecg-wash" d={ecgPath(10, 46, 6)} pathLength="1" vectorEffect="non-scaling-stroke" />
          <path className="ecg-line" d={ecgPath(10, 46, 6)} pathLength="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="arch-grid" aria-hidden="true">
          {LANES.map((id, i) => (
            <div key={id} className={`arch-clinic lane-${id.toLowerCase()}`} style={{ '--i': i }}>
              <span className="arch-pulse" />
              {labels.clinic} {id}
            </div>
          ))}
          <div className="arch-lanes is-top">{LANES.map((id) => <i key={id} className={`lane-${id.toLowerCase()}`} />)}</div>
          <Layer layer={labels.api} kind="api" lock={labels.lock} />
          <div className="arch-lanes is-mid">
            {LANES.map((id) => <i key={id} className={`lane-${id.toLowerCase()}`} />)}
            <i className="is-vault" />
          </div>
          <Layer layer={labels.db} kind="db" lock={labels.lock} />
          <div className="arch-vault">
            <span className="arch-tag">{labels.vault.tag}</span>
            <strong>{labels.vault.name}</strong>
            <span className="arch-layer-desc">{labels.vault.desc}</span>
          </div>
        </div>
      </div>
      <figcaption className="ecg-caption">{labels.caption}</figcaption>
    </figure>
  );
}
