'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { GENERATIONS, PET_STARTERS, PET_TYPES, SHINY_ODDS, petById, petFamily, triesFor } from '../../lib/pets';
import { canPhoto, setPhoto, setRetro, setRetroMusic, switchPet } from '../../lib/play';
import PetSprite from './PetSprite';

const TEXT = {
  pt: {
    title: 'Extras', open: 'Extras: modo Famicom, modo foto e Pokémon',
    retro: ['Modo Famicom', 'A cena em pixels, com música chiptune'],
    music: ['Música do Famicom', 'Tocando. Clique para ficar só com os pixels', 'Desligada. Clique para tocar'],
    photo: ['Modo foto', 'Esconde a página e solta a câmera da cena'],
    photoOff: 'Disponível na página inicial, com a cena 3D carregada.',
    pets: 'Companheiro Pokémon', petsHint: 'Escolha um inicial para subir a montanha com você. Clique novamente para retirar.',
    generation: 'Geração', choose: 'Escolha seu inicial', current: 'Com você',
    milestones: ['Início', 'Projetos', 'Contato / rio'],
    journey: 'Evolui nos Projetos e chega à forma final no Contato ou no fim do caminho até o rio.',
    party: 'Comemora no hanabi e dança no taiko. A escolha e a evolução ficam salvas neste navegador.',
    sound: 'O som da evolução segue a preferência de música do Famicom.',
    // Chance de shiny: `odds` 1 em N; `half` escolhas até 50% de já ter visto um
    shinyOdds: (n, pct, half) => `✦ Shiny: ${pct} de chance a cada inicial escolhido (1 em ${n}). Em ${half} escolhas, metade das pessoas já viu um.`,
    shinyShort: (n, pct) => `✦ Shiny: ${pct} por inicial escolhido (1 em ${n})`,
  },
  en: {
    title: 'Extras', open: 'Extras: Famicom mode, photo mode and Pokémon',
    retro: ['Famicom mode', 'The scene in pixels, with chiptune music'],
    music: ['Famicom music', 'Playing. Click to keep only the pixels', 'Off. Click to play'],
    photo: ['Photo mode', 'Hides the page and frees the scene camera'],
    photoOff: 'Available on the home page, once the 3D scene has loaded.',
    pets: 'Pokémon companion', petsHint: 'Choose a starter to climb the mountain with you. Click again to remove it.',
    generation: 'Generation', choose: 'Choose your starter', current: 'With you',
    milestones: ['Start', 'Projects', 'Contact / river'],
    journey: 'Evolves at Projects and reaches its final form at Contact or the end of the path to the river.',
    party: 'Celebrates in hanabi and dances in taiko. Your choice and evolution are saved in this browser.',
    sound: 'The evolution sound follows the Famicom music preference.',
    shinyOdds: (n, pct, half) => `✦ Shiny: ${pct} chance for every starter you pick (1 in ${n}). Within ${half} picks, half of all visitors have seen one.`,
    shinyShort: (n, pct) => `✦ Shiny: ${pct} per starter picked (1 in ${n})`,
  },
};

function Body({ t, language, onAction }) {
  const retro = useJourney((s) => s.retro);
  const music = useJourney((s) => s.retroMusic);
  const pets = useJourney((s) => s.pets);
  const shiny = useJourney((s) => s.petShiny);
  const companion = petById(pets[0]);
  const [generation, setGeneration] = useState(companion?.generation ?? 1);
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
      <p className="quality-auto play-pet-intro">{t.petsHint}</p>
      <div className="play-generations" role="group" aria-label={t.generation}>
        {GENERATIONS.map((gen) => (
          <button type="button" key={gen.id} aria-pressed={generation === gen.id} data-pet-generation={gen.id} onClick={() => setGeneration(gen.id)}>
            <b>{t.generation} {gen.id}</b><span>{gen.region}</span>
          </button>
        ))}
      </div>
      <div className="play-pets" role="group" aria-label={t.choose}>
        {PET_STARTERS.filter((pet) => pet.generation === generation).map((pet) => (
          <button key={pet.id} type="button" className="play-pet" data-type={pet.type} aria-pressed={companion?.starter === pet.id} data-pet-option={pet.id} onClick={() => switchPet(pet.id)}>
            <span className="play-pet-type"><span className="font-jp" lang="ja">{PET_TYPES[pet.type].jp}</span> {PET_TYPES[pet.type].name[language] ?? PET_TYPES[pet.type].name.pt}</span>
            {/* Só o escolhido mostra a cor que o sorteio deu; os outros, a normal */}
            <span className="play-pet-art"><PetSprite pet={pet} shiny={shiny && companion?.starter === pet.id} scale={1.3} /></span>
            <span className="play-pet-name">{pet.name[language] ?? pet.name.pt}</span>
          </button>
        ))}
      </div>
      {companion ? (
        <div className="play-evolution" data-pet-evolution="" data-type={companion.type}>
          <p>{t.current}: <strong>{companion.name[language] ?? companion.name.pt}</strong>{shiny ? <span className="play-shiny-tag" data-pet-shiny="">✦ Shiny</span> : null}</p>
          <ol className="play-evolution-chain" aria-label={t.journey}>
            {petFamily(companion.id).map((form) => (
              <li key={form.id} data-reached={form.stage <= companion.stage} aria-current={form.id === companion.id ? 'step' : undefined}>
                <span className="play-pet-art"><PetSprite pet={form} shiny={shiny} scale={0.8} /></span>
                <b>{form.name[language] ?? form.name.pt}</b>
                <span>{t.milestones[form.stage]}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <p className="play-shiny-odds" data-shiny-odds="">
        <span className="play-shiny-long">{t.shinyOdds(SHINY_ODDS, `${Math.round(100 / SHINY_ODDS)}%`, triesFor(0.5))}</span>
        <span className="play-shiny-short">{t.shinyShort(SHINY_ODDS, `${Math.round(100 / SHINY_ODDS)}%`)}</span>
      </p>
      <p className="quality-auto">{t.journey}</p>
      <p className="quality-auto">{t.party}</p>
      <p className="play-pet-credit">{t.sound} · Sprites: <a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">PokéAPI</a></p>
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
