'use client';
import { useEffect, useState } from 'react';
import { journeyStore, useJourney } from '../store/journey';

// Avisos da caça aos kodama: o contador (木霊 2/5) a cada achado, o letreiro da floresta liberada e,
// depois de liberada, o botão que acende e apaga a floresta dos espíritos (fica salvo)
const SPIRIT_KEY = 'oku-spirit';

export default function KodamaNotice() {
  const spirit = useJourney((s) => s.spirit);
  const [unlocked, setUnlocked] = useState(false);
  const [count, setCount] = useState(null);
  const [forest, setForest] = useState(0);

  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(SPIRIT_KEY) !== null);
    } catch {
      setUnlocked(false);
    }
    let countTimer = 0;
    let forestTimer = 0;
    const onFound = (e) => {
      clearTimeout(countTimer);
      setCount({ ...e.detail, key: performance.now() });
      countTimer = setTimeout(() => setCount(null), 2400);
    };
    const onForest = () => {
      clearTimeout(countTimer);
      setCount(null);
      setUnlocked(true);
      setForest(performance.now());
      forestTimer = setTimeout(() => setForest(0), 4500);
    };
    window.addEventListener('kodama-found', onFound);
    window.addEventListener('kodama-forest', onForest);
    return () => {
      clearTimeout(countTimer);
      clearTimeout(forestTimer);
      window.removeEventListener('kodama-found', onFound);
      window.removeEventListener('kodama-forest', onForest);
    };
  }, []);

  const toggle = () => {
    const next = !journeyStore.getState().spirit;
    journeyStore.getState().setSpirit(next);
    try {
      localStorage.setItem(SPIRIT_KEY, next ? '1' : '0');
    } catch {
      // Storage bloqueado: só não persiste
    }
  };

  const en = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en';
  return (
    <>
      {count && !forest ? (
        <p key={count.key} className="koi-chip kodama-chip" role="status">
          <span className="font-jp" lang="ja">木霊</span> {count.count} / {count.total}
        </p>
      ) : null}
      {forest ? (
        <div key={forest} className="koi-banner kodama-banner" role="status">
          <p className="koi-banner-jp font-jp" lang="ja">木霊の森</p>
          <p className="koi-banner-sub">{en ? 'You found every kodama: the spirit forest is awake' : 'Você achou todos os kodama: a floresta dos espíritos acordou'}</p>
        </div>
      ) : null}
      {unlocked ? (
        <button
          type="button"
          className="kodama-toggle"
          aria-pressed={spirit}
          onClick={toggle}
          aria-label={en ? 'Spirit forest' : 'Floresta dos espíritos'}
          title={en ? 'Spirit forest' : 'Floresta dos espíritos'}
        >
          <span className="font-jp" lang="ja">木霊</span>
        </button>
      ) : null}
    </>
  );
}
