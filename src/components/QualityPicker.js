'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { MonitorCog } from 'lucide-react';
import { journeyStore, useJourney } from '../store/journey';
import { useSettings } from '../context/SettingsContext';
import { QUALITY_LEVELS, saveQuality } from '../lib/journey/quality';

const TEXT = {
  pt: {
    title: 'Gráficos',
    open: (level) => `Gráficos: ${level}`,
    levels: {
      low: ['Mínimo', 'Leve, roda em qualquer aparelho'],
      medium: ['Médio', 'Mais árvores, partículas e nitidez'],
      high: ['Alto', 'Brilho das luzes e resolução máxima'],
    },
  },
  en: {
    title: 'Graphics',
    open: (level) => `Graphics: ${level}`,
    levels: {
      low: ['Minimum', 'Light, runs on any device'],
      medium: ['Medium', 'More trees, particles and sharpness'],
      high: ['High', 'Glowing lights and full resolution'],
    },
  },
};

function Options({ t, quality, onPick, labelledBy }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="quality-options">
      {QUALITY_LEVELS.map((level) => {
        const [name, hint] = t.levels[level];
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={quality === level}
            className="quality-option"
            onClick={() => onPick(level)}
          >
            <span className="quality-option-name">{name}</span>
            <span className="quality-option-hint">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}

// 画質: a qualidade gráfica da cena. Começa no mínimo; a escolha fica salva no navegador.
// `inline` mostra as opções direto (menu do celular); senão, um botão abre o painel
export default function QualityPicker({ inline = false }) {
  const { language } = useSettings();
  const t = TEXT[language] ?? TEXT.pt;
  const quality = useJourney((s) => s.quality) ?? 'low';
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const id = useId();

  const pick = (level) => {
    journeyStore.getState().setQuality(level);
    saveQuality(window.localStorage, level);
    setOpen(false);
  };

  // Fecha ao clicar fora ou com Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (inline) {
    return (
      <div className="quality is-inline">
        <p id={id} className="quality-title"><span className="font-jp" aria-hidden="true">画質</span> {t.title}</p>
        <Options t={t} quality={quality} onPick={pick} labelledBy={id} />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="quality">
      <button
        type="button"
        className="quality-button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t.open(t.levels[quality][0])}
        title={t.open(t.levels[quality][0])}
        onClick={() => setOpen((o) => !o)}
      >
        <MonitorCog size={20} aria-hidden="true" />
      </button>
      {open && (
        <div className="quality-pop">
          <p id={id} className="quality-title"><span className="font-jp" aria-hidden="true">画質</span> {t.title}</p>
          <Options t={t} quality={quality} onPick={pick} labelledBy={id} />
        </div>
      )}
    </div>
  );
}
