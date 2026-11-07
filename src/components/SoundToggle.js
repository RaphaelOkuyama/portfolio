'use client';
import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const TEXT = {
  pt: { on: 'Desligar o som ambiente', off: 'Ligar o som ambiente', label: 'Som' },
  en: { on: 'Turn ambient sound off', off: 'Turn ambient sound on', label: 'Sound' },
};
const GESTURES = ['pointerdown', 'keydown', 'touchstart'];

// 音: som ambiente da montanha (vento, rio, fūrin). Desligado por padrão; o código do som só baixa
// quando alguém liga. Quem deixou ligado ouve de novo a partir do primeiro gesto da próxima visita
export default function SoundToggle({ inline = false }) {
  const { language } = useSettings();
  const t = TEXT[language] ?? TEXT.pt;
  const [on, setOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('../lib/sound/ambience').then(({ savedSoundOn, setAmbience }) => {
      if (cancelled || !savedSoundOn()) return;
      setOn(true);
      const resume = () => {
        GESTURES.forEach((type) => window.removeEventListener(type, resume));
        setAmbience(true);
      };
      GESTURES.forEach((type) => window.addEventListener(type, resume, { once: true, passive: true }));
    }).catch(() => {});
    // Os dois botões (barra e menu do celular) mostram o mesmo estado
    const sync = (e) => setOn(Boolean(e.detail));
    window.addEventListener('oku:sound', sync);
    return () => {
      cancelled = true;
      window.removeEventListener('oku:sound', sync);
    };
  }, []);

  const toggle = async () => {
    const next = !on;
    const { saveSound, setAmbience } = await import('../lib/sound/ambience');
    if (!setAmbience(next)) return;
    saveSound(next);
    setOn(next);
    window.dispatchEvent(new CustomEvent('oku:sound', { detail: next }));
  };

  return (
    <button
      type="button"
      className={`sound-toggle${inline ? ' is-inline' : ''}`}
      aria-pressed={on}
      aria-label={on ? t.on : t.off}
      title={on ? t.on : t.off}
      onClick={toggle}
    >
      {on ? <Volume2 size={inline ? 24 : 20} aria-hidden="true" /> : <VolumeX size={inline ? 24 : 20} aria-hidden="true" />}
      {inline ? <span>{t.label}</span> : null}
      {on ? <span className="sound-bars" aria-hidden="true"><i /><i /><i /></span> : null}
    </button>
  );
}
