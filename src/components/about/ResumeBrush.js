'use client';
import { useEffect, useMemo, useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { prepareStroke, strokeOffset } from '../../lib/gsapCore';
import { SHODO_STROKES, KANJI_GRID } from '../../lib/shodo';

// 履歴書: antes de baixar, o currículo é pintado como no shodō do site. A folha de washi surge, o
// pincel escreve 奥山 na margem (os traços reais, na ordem certa), o nome e as seções aparecem, as
// linhas do texto são pinceladas em tinta, o hanko carimba e a folha voa enquanto o download
// começa. Um clique (ou Esc) pula direto para o download. ~1,9 s
const W = 420;
const H = 594; // A4

// Pincelada horizontal com um leve tremor de mão, da esquerda para a direita
function brushLine(x, y, length, seed) {
  const r = (n) => Math.sin(seed * 12.9898 + n * 78.233) * 0.5;
  const y1 = y + r(1) * 1.6;
  const y2 = y + r(2) * 1.6;
  return `M${x},${y} C${x + length * 0.33},${y1} ${x + length * 0.66},${y2} ${x + length},${y + r(3) * 1.2}`;
}

export default function ResumeBrush({ href, filename, labels, onDone }) {
  const rootRef = useRef(null);

  // As "linhas" do currículo: em cada seção, um título e algumas pinceladas de texto
  const layout = useMemo(() => {
    const sections = [];
    let y = 196;
    labels.sections.forEach((title, si) => {
      const lines = [];
      const count = [4, 3, 3, 2][si] ?? 2;
      for (let i = 0; i < count; i += 1) {
        const length = 230 - ((si * 7 + i * 31) % 90);
        lines.push({ d: brushLine(44, y + 26 + i * 15, length, si * 10 + i), width: i === 0 ? 2.6 : 2 });
      }
      sections.push({ title, y, lines });
      y += 40 + count * 15 + 18;
    });
    return sections;
  }, [labels.sections]);

  useEffect(() => {
    const root = rootRef.current;
    const q = (s) => root.querySelectorAll(s);
    let downloaded = false;
    const download = () => {
      if (downloaded) return;
      downloaded = true;
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    const strokes = [...q('.rb-kanji path'), ...q('.rb-line')];
    strokes.forEach((el) => {
      prepareStroke(el);
      el.style.strokeDashoffset = String(strokeOffset(el, 0));
    });
    const kanji = [...q('.rb-kanji path')];
    const lines = [...q('.rb-line')];

    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(q('.rb-dim'), { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0)
      // A folha desenrola de cima para baixo, como um rolo
      .fromTo(q('.rb-paper'), { clipPath: 'inset(0% 0% 100% 0%)', y: 24, rotate: -1.5 }, {
        clipPath: 'inset(0% 0% 0% 0%)', y: 0, rotate: -1, duration: 0.42, ease: 'power3.out',
      }, 0.05)
      // 奥山 na margem: cada traço na ordem, rápido como mão treinada
      .to(kanji, { strokeDashoffset: (i, el) => strokeOffset(el, 1), duration: 0.09, stagger: 0.035, ease: 'power1.in' }, 0.3)
      // Nome e função aparecem como tinta assentando (sem a borda dura de um fade)
      .fromTo(q('.rb-name, .rb-role'), { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0.4 }, {
        clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out',
      }, 0.35)
      .fromTo(q('.rb-section-title'), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.16, ease: 'power2.out' }, 0.62)
      .to(lines, { strokeDashoffset: (i, el) => strokeOffset(el, 1), duration: 0.16, stagger: 0.045, ease: 'power2.inOut' }, 0.7)
      // 判子: o carimbo assina
      .fromTo(q('.rb-hanko'), { opacity: 0, scale: 1.8, rotate: -20 }, { opacity: 1, scale: 1, rotate: -8, duration: 0.3, ease: 'hanko' }, 1.38)
      .add(download, 1.55)
      // A folha voa para baixo (para a pasta de downloads)
      .to(q('.rb-paper'), { y: 120, scale: 0.6, rotate: 6, opacity: 0, duration: 0.42, ease: 'power3.in' }, 1.62)
      .to(q('.rb-dim'), { opacity: 0, duration: 0.35 }, 1.75);

    const skip = () => {
      download();
      tl.kill();
      onDone();
    };
    const onKey = (e) => { if (e.key === 'Escape') skip(); };
    root.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', onKey);
    return () => {
      tl.kill();
      root.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', onKey);
    };
  }, [href, filename, onDone]);

  const scale = 40 / KANJI_GRID;
  return (
    <div ref={rootRef} className="rb" role="status" aria-live="polite">
      <span className="sr-only">{labels.status}</span>
      <div className="rb-dim" aria-hidden="true" />
      <div className="rb-paper" aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} className="rb-svg">
          {/* Tinta no papel: a borda do traço fica irregular, como pincel em washi */}
          <defs>
            <filter id="rb-ink" x="-5%" y="-20%" width="110%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain" />
              <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.6" />
            </filter>
          </defs>
          {/* 奥山 na margem direita, de cima para baixo */}
          <g className="rb-kanji" filter="url(#rb-ink)" transform={`translate(${W - 78} 30) scale(${scale})`}>
            {SHODO_STROKES.奥.map((d) => <path key={d} d={d} />)}
          </g>
          <g className="rb-kanji" filter="url(#rb-ink)" transform={`translate(${W - 78} 76) scale(${scale})`}>
            {SHODO_STROKES.山.map((d) => <path key={d} d={d} />)}
          </g>
          <text className="rb-name" x="44" y="78">{labels.name}</text>
          <text className="rb-role" x="44" y="104">{labels.role}</text>
          <path className="rb-rule" d="M44 128 L340 126" />
          {layout.map((s) => (
            <g key={s.title}>
              <text className="rb-section-title" x="44" y={s.y + 8}>{s.title}</text>
              <g filter="url(#rb-ink)">
                {s.lines.map((l) => <path key={l.d} className="rb-line" d={l.d} strokeWidth={l.width} />)}
              </g>
            </g>
          ))}
        </svg>
        <span className="rb-hanko font-jp" lang="ja">奥山</span>
      </div>
    </div>
  );
}
