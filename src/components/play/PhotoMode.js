'use client';
import { useEffect, useRef, useState } from 'react';
import { useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { movePhoto, resetPhoto, setPhoto } from '../../lib/play';

const TEXT = {
  pt: { label: 'Modo foto', hint: 'Arraste para olhar · roda do mouse aproxima · WASD move · Q e E sobem e descem', save: 'Salvar foto', reset: 'Reiniciar', exit: 'Sair', saved: 'Foto salva' },
  en: { label: 'Photo mode', hint: 'Drag to look · mouse wheel zooms · WASD moves · Q and E go up and down', save: 'Save photo', reset: 'Reset', exit: 'Exit', saved: 'Photo saved' },
};
const KEYS = {
  w: { dolly: 0.5 }, s: { dolly: -0.5 }, a: { truck: -0.4 }, d: { truck: 0.4 }, q: { lift: -0.3 }, e: { lift: 0.3 },
  arrowup: { dolly: 0.5 }, arrowdown: { dolly: -0.5 }, arrowleft: { truck: -0.4 }, arrowright: { truck: 0.4 },
};

// 写真: o modo foto. A página some, a câmera da cena fica solta (em volta do ponto da trilha em
// que a pessoa estava) e um botão salva o quadro como PNG (quem tira a foto é o PhotoShot, dentro
// da cena)
export default function PhotoMode() {
  const on = useJourney((s) => s.photo);
  const { language } = useSettings();
  const t = TEXT[language] ?? TEXT.pt;
  const rootRef = useRef(null);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (!on) return undefined;
    const root = rootRef.current;
    let drag = null;
    const onDown = (e) => {
      if (e.target.closest('button')) return;
      drag = { x: e.clientX, y: e.clientY };
      root.setPointerCapture?.(e.pointerId);
      root.classList.add('is-dragging');
    };
    const onMove = (e) => {
      if (!drag) return;
      movePhoto({ yaw: (e.clientX - drag.x) * 0.0035, pitch: (e.clientY - drag.y) * 0.0025 });
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      drag = null;
      root.classList.remove('is-dragging');
    };
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      movePhoto({ dolly: -e.deltaY * 0.006 });
    };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') setPhoto(false);
      else if (key === 'r') resetPhoto();
      else if (KEYS[key]) {
        e.preventDefault();
        movePhoto(KEYS[key]);
      }
    };
    const onShot = () => setFlash((n) => n + 1);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    window.addEventListener('oku:photo-saved', onShot);
    root.querySelector('.photo-save')?.focus();
    return () => {
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('oku:photo-saved', onShot);
    };
  }, [on]);

  // Saiu da home com o modo ligado (voltar do navegador): desliga
  const route = useJourney((s) => s.route);
  useEffect(() => {
    if (on && route !== 'journey') setPhoto(false);
  }, [on, route]);

  if (!on) return null;
  return (
    <div ref={rootRef} className="photo" data-photo="" role="application" aria-label={t.label}>
      {flash ? <span key={flash} className="photo-flash" aria-hidden="true" /> : null}
      <span className="photo-frame" aria-hidden="true" />
      <div className="photo-bar">
        <p className="photo-hint">{t.hint}</p>
        <div className="photo-actions">
          <button type="button" className="photo-save" onClick={() => window.dispatchEvent(new Event('oku:photo-shot'))}>{t.save}</button>
          <button type="button" onClick={resetPhoto}>{t.reset}</button>
          <button type="button" onClick={() => setPhoto(false)}>{t.exit} <kbd>Esc</kbd></button>
        </div>
        <p className="photo-status" role="status">{flash ? t.saved : ''}</p>
      </div>
    </div>
  );
}
