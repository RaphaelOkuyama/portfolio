'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { journeyStore, useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { PETS, SHINY_ODDS, evolvedPet, savePets } from '../../lib/pets';
import { loadPets } from '../../lib/play';
import { playShinySound, unlockEvolutionSound } from '../../lib/sound/pokemon';
import Evolution from './Evolution';
import PetSprite from './PetSprite';

// Ritmo de console antigo: os bichos se mexem em poucos quadros por segundo
const TICK_MS = 150;
// Acordam com a rolagem ou um toque e, à noite, voltam a dormir depois deste tempo parados
const AWAKE_MS = 3500;
const WALK_MS = 320;
const STEP = 5;

// Largura de cada bicho na barra do topo (px), com a folga entre eles
const SLOT_EACH = 64;
// Escala dos sprites na barra (o tamanho natural de cada forma vezes isto)
const BAR_SCALE = 0.72;

// 育: os bichinhos escolhidos no menu de extras. Moram na barra do topo, no vão entre o nome e o
// menu, para não cobrir nada da página; quando a barra não tem esse vão (celular, tablet, janela
// estreita), ficam sentados na borda de baixo dela, do lado direito. Andam quando a página rola
// (para o lado da rolagem) e dormem no tema da noite. Nos extras, acompanham o festival.
export default function Pets() {
  const pathname = usePathname();
  const projectsOpen = pathname === '/projects' || pathname.startsWith('/projects/');
  const ids = useJourney((s) => s.pets);
  const shiny = useJourney((s) => s.petShiny);
  // O sorteio acabou de dar shiny: brilho e um balão no bichinho por alguns segundos
  const [reveal, setReveal] = useState(0);
  const theme = useJourney((s) => s.theme);
  const section = useJourney((s) => s.section);
  const atRiver = useJourney((s) => s.progress >= 0.99);
  const route = useJourney((s) => s.route);
  const festival = useJourney((s) => s.festival);
  const photo = useJourney((s) => s.photo);
  const { language } = useSettings();
  const rootRef = useRef(null);
  const [asleep, setAsleep] = useState(false);
  const [party, setParty] = useState(null);
  const [evolving, setEvolving] = useState(false);
  // Cenas de evolução na fila (uma por vez): { key, from, to }
  const [scenes, setScenes] = useState([]);
  const live = useRef({ scrollAt: 0, activeAt: 0, dir: 1, lastY: 0, frame: 0, poked: {}, pokes: {}, cheerAt: -9999, party: null, pulses: 0, shown: 0 });
  // Na barra: o vão do topo (se couberem todos); senão null e eles sentam na borda da barra
  const [slot, setSlot] = useState(null);
  const [perchTop, setPerchTop] = useState(64);

  useEffect(() => { loadPets(); }, []);

  useEffect(() => {
    const onParty = ({ detail }) => {
      live.current.party = detail.mode;
      setParty(detail.mode);
      if (detail.pulse) {
        // Conta a batida; quem marca a hora da comemoração é o próximo passo do bichinho, para
        // nenhuma se perder quando a página está pesada e os passos atrasam
        live.current.pulses += 1;
        live.current.activeAt = performance.now();
        setAsleep(false);
      }
    };
    const unlock = () => { if (journeyStore.getState().pets.length) unlockEvolutionSound(); };
    const onShiny = () => {
      setReveal((n) => n + 1);
      live.current.activeAt = performance.now();
      setAsleep(false);
      playShinySound();
    };
    window.addEventListener('oku:pet-shiny', onShiny);
    window.addEventListener('oku:pet-festival', onParty);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('oku:pet-shiny', onShiny);
      window.removeEventListener('oku:pet-festival', onParty);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    const current = ids[0];
    if (!current) return undefined;
    // Deixa o marco assentar para não evoluir durante uma passagem rápida pela seção.
    const timer = setTimeout(() => {
      const state = journeyStore.getState();
      if (state.pets[0] !== current) return;
      const next = evolvedPet(current, { ...state, projectsOpen });
      if (!next || next.id === current) return;
      journeyStore.setState({ pets: [next.id] });
      try { savePets(window.localStorage, [next.id]); } catch { /* Vale nesta visita. */ }
      live.current.activeAt = performance.now();
      setAsleep(false);
      const from = PETS.find((pet) => pet.id === current);
      setScenes((list) => [...list, { key: `${current}-${next.id}`, from, to: next }]);
    }, 650);
    return () => clearTimeout(timer);
  }, [ids, section, atRiver, route, festival, photo, projectsOpen]);

  // Fim da cena: o bicho na barra brilha e a próxima da fila (se houver) começa
  const sceneDone = useCallback(() => {
    // Acabou de evoluir: fica acordado um pouco antes de voltar a dormir (à noite)
    live.current.activeAt = performance.now();
    setAsleep(false);
    setScenes((list) => list.slice(1));
    setEvolving(true);
  }, []);

  useEffect(() => {
    if (!reveal) return undefined;
    const timer = setTimeout(() => setReveal(0), 3600);
    return () => clearTimeout(timer);
  }, [reveal]);

  useEffect(() => {
    if (!evolving) return undefined;
    const timer = setTimeout(() => setEvolving(false), 1400);
    return () => clearTimeout(timer);
  }, [evolving]);

  const pets = PETS.filter((p) => ids.includes(p.id));
  const count = pets.length;

  useEffect(() => {
    if (!count) return undefined;
    const place = () => {
      const el = document.querySelector('[data-pets-slot]');
      const menu = document.querySelector('.desktop-menu');
      const before = el?.previousElementSibling;
      // A folga de verdade entre o que vem antes (nome ou selo) e o menu, com uma margem de cada lado
      const room = el && menu && before && menu.offsetParent !== null
        ? menu.getBoundingClientRect().left - before.getBoundingClientRect().right - 32
        : 0;
      const fits = room >= count * SLOT_EACH + 8;
      setSlot(fits ? el : null);
      const nav = document.querySelector('.site-nav');
      if (nav) setPerchTop(Math.round(nav.getBoundingClientRect().bottom));
    };
    place();
    window.addEventListener('resize', place);
    // As fontes mudam a largura do nome (e do vão) depois de carregar
    document.fonts?.ready.then(place).catch(() => {});
    return () => window.removeEventListener('resize', place);
  }, [count]);

  useEffect(() => {
    if (!count) return undefined;
    const state = live.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.lastY = window.scrollY;
    state.activeAt = performance.now();
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - state.lastY) < 2) return;
      state.dir = y > state.lastY ? 1 : -1;
      state.lastY = y;
      state.scrollAt = performance.now();
      state.activeAt = state.scrollAt;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = setInterval(() => {
      const now = performance.now();
      state.frame += 1;
      // Evoluindo conta como acordado (e o tempo para dormir recomeça no fim)
      if (rootRef.current?.querySelector('.evo')) state.activeAt = now;
      const sleeping = !state.party && theme === 'night' && now - state.activeAt > AWAKE_MS;
      setAsleep(sleeping);
      const walking = !reduced && now - state.scrollAt < WALK_MS;
      const els = rootRef.current?.querySelectorAll('.pet') ?? [];
      const box = rootRef.current;
      const inBar = box?.dataset.place === 'bar';
      // Na barra andam pelo vão todo; sentados na borda, só um pouco (para a esquerda)
      const range = inBar ? Math.max(0, (box.parentElement?.clientWidth ?? 0) - box.scrollWidth) : 40;
      els.forEach((el, i) => {
        const x = Number(el.dataset.x ?? 0);
        const next = walking ? Math.min(range, Math.max(0, x + state.dir * STEP)) : x;
        el.dataset.x = String(next);
        // O carinho vale a partir do passo seguinte (mesmo que ele atrase)
        if (state.pokes[el.dataset.pet]) {
          state.pokes[el.dataset.pet] = false;
          state.poked[el.dataset.pet] = now;
        }
        const poked = now - (state.poked[el.dataset.pet] ?? -9999) < 500;
        if (i === 0 && state.pulses !== state.shown) {
          state.shown = state.pulses;
          state.cheerAt = now;
        }
        const cheering = state.party && now - state.cheerAt < (state.party === 'taiko' ? 260 : 650);
        // Andando: um pulinho a cada passo, cada bicho num compasso; parado: respira de leve
        const hop = reduced ? 0 : cheering ? -9 : poked ? -10 : walking ? ((state.frame + i) % 2 ? -4 : 0) : (!sleeping && (state.frame + i * 3) % 8 < 2 ? -1 : 0);
        // Evoluindo: fica parado e de frente (o balão de texto não pode espelhar)
        const busy = Boolean(el.querySelector('.evo'));
        el.style.transform = `translate(${inBar ? next : -next}px, ${busy ? 0 : hop}px) scaleX(${!busy && state.dir < 0 && walking ? -1 : 1})`;
        el.dataset.mood = cheering ? (state.party === 'taiko' ? 'dance' : 'cheer') : sleeping ? 'sleep' : poked ? 'love' : '';
      });
    }, TICK_MS);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(timer);
    };
  }, [count, theme]);

  // A evolução acontece no próprio bichinho (a forma nova já é a do companheiro)
  const scene = scenes[0];
  if (!count) return null;
  const poke = (id) => {
    const now = performance.now();
    live.current.activeAt = now;
    live.current.pokes[id] = true;
    setAsleep(false);
  };

  const box = (
    <div ref={rootRef} className="pets" data-pets="" data-place={party ? 'festival' : slot ? 'bar' : 'perch'} data-festival={party || undefined} data-evolving={evolving || undefined} style={party || slot ? undefined : { top: perchTop }} aria-hidden={party ? true : undefined}>
      {pets.map((pet) => (
        <button
          key={pet.id}
          type="button"
          className="pet"
          data-pet={pet.id}
          data-shiny={shiny || undefined}
          title={`${pet.name[language] ?? pet.name.pt}${shiny ? ' ✦ Shiny' : ''}`}
          tabIndex={party ? -1 : 0}
          aria-label={language === 'en' ? `${pet.name.en}${shiny ? ' shiny' : ''}: pet it` : `${pet.name.pt}${shiny ? ' shiny' : ''}: fazer carinho`}
          onClick={() => poke(pet.id)}
        >
          {scene && scene.to.id === pet.id
            ? <Evolution key={scene.key} from={scene.from} to={scene.to} shiny={shiny} scale={party === 'taiko' ? 1.9 : party ? 1.5 : BAR_SCALE} language={language} onDone={sceneDone} />
            : <PetSprite pet={pet} shiny={shiny} asleep={asleep} scale={party === 'taiko' ? 1.9 : party ? 1.5 : BAR_SCALE} />}
          <span className="pet-bubble" aria-hidden="true" />
          {reveal ? (
            <>
              <span key={`b${reveal}`} className="pet-shiny-burst" aria-hidden="true" />
              <span key={`n${reveal}`} className="evo-bubble pet-note" role="status">
                {language === 'en' ? `✦ Shiny ${pet.name.en}! A 1 in ${SHINY_ODDS} roll.` : `✦ ${pet.name.pt} shiny! Sorte de 1 em ${SHINY_ODDS}.`}
              </span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
  return (
    <>
      {party ? createPortal(box, document.body) : slot ? createPortal(box, slot) : box}
    </>
  );
}
