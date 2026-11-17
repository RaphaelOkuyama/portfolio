'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { PETS } from '../../lib/pets';
import { canPhoto, setPhoto, setRetro, setRetroMusic, switchPet } from '../../lib/play';
import PetSprite from './PetSprite';

const TEXT = {
  pt: {
    title: 'Extras', open: 'Extras: modo Famicom, modo foto e bichinhos',
    retro: ['Modo Famicom', 'A cena em pixels, com música chiptune'],
    music: ['Música do Famicom', 'Tocando. Clique para ficar só com os pixels', 'Desligada. Clique para tocar'],
    photo: ['Modo foto', 'Esconde a página e solta a câmera da cena'],
    photoOff: 'Disponível na página inicial, com a cena 3D carregada.',
    pets: 'Bichinhos', petsHint: 'Escolha quantos quiser. Andam com a rolagem e dormem à noite.',
  },
  en: {
    title: 'Extras', open: 'Extras: Famicom mode, photo mode and pets',
    retro: ['Famicom mode', 'The scene in pixels, with chiptune music'],
    music: ['Famicom music', 'Playing. Click to keep only the pixels', 'Off. Click to play'],
    photo: ['Photo mode', 'Hides the page and frees the scene camera'],
    photoOff: 'Available on the home page, once the 3D scene has loaded.',
    pets: 'Pets', petsHint: 'Pick as many as you like. They walk as you scroll and sleep at night.',
  },
};

function Body({ t, language, onAction }) {
  const retro = useJourney((s) => s.retro);
  const music = useJourney((s) => s.retroMusic);
  const pets = useJourney((s) => s.pets);
  // Só dá para saber na hora de abrir: depende da rota e de a cena já ter chegado
  const [photoOk, setPhotoOk] = useState(false);
  useEffect(() => { setPhotoOk(canPhoto()); }, []);
  return (
    <>
      <div className="quality-options">
        <button type="button" className="quality-option" aria-pressed={retro} data-play="retro" onClick={() => setRetro(!retro)}>
          <span className="quality-option-name"><span className="font-jp" lang="ja" aria-hidden="true">遊 </span>{t.retro[0]}</span>
          <span className="quality-option-hint">{t.retro[1]}</span>
        </button>
        {retro ? (
          <button type="button" className="quality-option" aria-pressed={music} data-play="retro-music" onClick={() => setRetroMusic(!music)}>
            <span className="quality-option-name"><span className="font-jp" lang="ja" aria-hidden="true">音 </span>{t.music[0]}</span>
            <span className="quality-option-hint">{music ? t.music[1] : t.music[2]}</span>
          </button>
        ) : null}
        <button type="button" className="quality-option" data-play="photo" disabled={!photoOk} onClick={() => { if (setPhoto(true)) onAction(); }}>
          <span className="quality-option-name"><span className="font-jp" lang="ja" aria-hidden="true">写 </span>{t.photo[0]}</span>
          <span className="quality-option-hint">{photoOk ? t.photo[1] : t.photoOff}</span>
        </button>
      </div>
      <p className="quality-title play-pets-title"><span className="font-jp" aria-hidden="true">育</span> {t.pets}</p>
      <div className="play-pets" role="group" aria-label={t.pets}>
        {PETS.map((pet) => (
          <button key={pet.id} type="button" className="play-pet" aria-pressed={pets.includes(pet.id)} data-pet-option={pet.id} onClick={() => switchPet(pet.id)}>
            <PetSprite pet={pet} size={36} />
            <span>{pet.name[language] ?? pet.name.pt}</span>
          </button>
        ))}
      </div>
      <p className="quality-auto">{t.petsHint}</p>
    </>
  );
}

// 遊: o menu de extras (modo Famicom, modo foto, bichinhos). `inline` mostra tudo direto (menu
// do celular); senão, um botão na barra abre o painel
export default function PlayMenu({ inline = false, onAction = () => {} }) {
  const { language } = useSettings();
  const t = TEXT[language] ?? TEXT.pt;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const id = useId();

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
      <div className="quality is-inline play">
        <p id={id} className="quality-title"><span className="font-jp" aria-hidden="true">遊</span> {t.title}</p>
        <Body t={t} language={language} onAction={onAction} />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="quality play">
      <button type="button" className="quality-button" aria-haspopup="true" aria-expanded={open} aria-label={t.open} title={t.open} onClick={() => setOpen((o) => !o)}>
        <Gamepad2 size={20} aria-hidden="true" />
      </button>
      {open && (
        <div className="quality-pop play-pop" aria-labelledby={id}>
          <p id={id} className="quality-title"><span className="font-jp" aria-hidden="true">遊</span> {t.title}</p>
          <Body t={t} language={language} onAction={() => { setOpen(false); onAction(); }} />
        </div>
      )}
    </div>
  );
}
