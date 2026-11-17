'use client';
import { useEffect, useRef, useState } from 'react';
import { useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { PETS } from '../../lib/pets';
import { loadPets } from '../../lib/play';
import PetSprite from './PetSprite';

// Ritmo de console antigo: os bichos se mexem em poucos quadros por segundo
const TICK_MS = 150;
// Acordam com a rolagem ou um toque e, à noite, voltam a dormir depois deste tempo parados
const AWAKE_MS = 3500;
const WALK_MS = 320;
const STEP = 5;

// 育: os bichinhos escolhidos no menu de extras, no canto de baixo da tela. Andam quando a página
// rola (para o lado da rolagem), piscam parados e dormem no tema da noite
export default function Pets() {
  const ids = useJourney((s) => s.pets);
  const theme = useJourney((s) => s.theme);
  const { language } = useSettings();
  const rootRef = useRef(null);
  const [asleep, setAsleep] = useState(false);
  const [blink, setBlink] = useState(false);
  const live = useRef({ scrollAt: 0, activeAt: 0, dir: 1, lastY: 0, frame: 0, poked: {} });

  useEffect(() => { loadPets(); }, []);

  const pets = PETS.filter((p) => ids.includes(p.id));
  const count = pets.length;

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
      const sleeping = theme === 'night' && now - state.activeAt > AWAKE_MS;
      setAsleep(sleeping);
      // Pisca de vez em quando (um quadro de olho fechado)
      setBlink(!sleeping && state.frame % 23 === 0);
      const walking = !reduced && now - state.scrollAt < WALK_MS;
      const els = rootRef.current?.querySelectorAll('.pet') ?? [];
      const range = Math.max(0, Math.min(150, window.innerWidth * 0.3));
      els.forEach((el, i) => {
        const x = Number(el.dataset.x ?? 0);
        const next = walking ? Math.min(range, Math.max(0, x + state.dir * STEP)) : x;
        el.dataset.x = String(next);
        const poked = now - (state.poked[el.dataset.pet] ?? -9999) < 500;
        // Andando: um pulinho a cada passo, cada bicho num compasso; parado: respira de leve
        const hop = poked ? -10 : walking ? ((state.frame + i) % 2 ? -4 : 0) : (!sleeping && !reduced && (state.frame + i * 3) % 8 < 2 ? -1 : 0);
        el.style.transform = `translate(${next}px, ${hop}px) scaleX(${state.dir < 0 && walking ? -1 : 1})`;
        el.dataset.mood = sleeping ? 'sleep' : poked ? 'love' : '';
      });
    }, TICK_MS);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(timer);
    };
  }, [count, theme]);

  if (!count) return null;
  const poke = (id) => {
    const now = performance.now();
    live.current.activeAt = now;
    live.current.poked[id] = now;
    setAsleep(false);
  };

  return (
    <div ref={rootRef} className="pets" data-pets="">
      {pets.map((pet) => (
        <button
          key={pet.id}
          type="button"
          className="pet"
          data-pet={pet.id}
          aria-label={language === 'en' ? `${pet.name.en}: pet it` : `${pet.name.pt}: fazer carinho`}
          onClick={() => poke(pet.id)}
        >
          <PetSprite pet={pet} asleep={asleep || blink} />
          <span className="pet-bubble" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
