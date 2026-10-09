'use client';
import { useEffect, useState } from 'react';

// Avisos das carpas: o contador da ração (餌 3/9) a cada grão comido e, na nona, o letreiro do
// 鯉の滝登り (a carpa que sobe a cachoeira vira dragão). Discretos, somem sozinhos
export default function KoiNotice() {
  const [fed, setFed] = useState(null);
  const [dragon, setDragon] = useState(0);

  useEffect(() => {
    let fedTimer = 0;
    let dragonTimer = 0;
    const onFed = (e) => {
      clearTimeout(fedTimer);
      setFed({ ...e.detail, key: performance.now() });
      fedTimer = setTimeout(() => setFed(null), 1600);
    };
    const onDragon = () => {
      clearTimeout(dragonTimer);
      setFed(null);
      setDragon(performance.now());
      dragonTimer = setTimeout(() => setDragon(0), 4200);
    };
    window.addEventListener('koi-fed', onFed);
    window.addEventListener('koi-dragon', onDragon);
    return () => {
      clearTimeout(fedTimer);
      clearTimeout(dragonTimer);
      window.removeEventListener('koi-fed', onFed);
      window.removeEventListener('koi-dragon', onDragon);
    };
  }, []);

  const en = typeof document !== 'undefined' && document.documentElement.getAttribute('data-language') === 'en';
  return (
    <>
      {fed && !dragon ? (
        <p key={fed.key} className="koi-chip" role="status">
          <span className="font-jp" lang="ja">餌</span> {fed.count} / {fed.goal}
        </p>
      ) : null}
      {dragon ? (
        <div key={dragon} className="koi-banner" role="status">
          <p className="koi-banner-jp font-jp" lang="ja">鯉の滝登り</p>
          <p className="koi-banner-sub">
            {en ? 'The koi climbed the waterfall and became a dragon' : 'A carpa subiu a cachoeira e virou dragão'}
          </p>
        </div>
      ) : null}
    </>
  );
}
