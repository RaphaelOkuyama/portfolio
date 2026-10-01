'use client';
import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { profile } from '../data/resume';
import { gsap } from '../lib/gsap';
import { createClickCounter, TSURU_EVENT } from '../lib/easterEgg';

// Rodapé assinado com o hanko 奥山, como a última página de um emakimono
export default function Footer() {
  const { currentData } = useSettings();
  const countClick = useMemo(() => createClickCounter(5, 2500), []);

  // Cada clique carimba; o quinto seguido solta o bando de tsurus (千羽鶴)
  const stamp = (e) => {
    gsap.fromTo(e.currentTarget, { scale: 0.86 }, { scale: 1, duration: 0.35, ease: 'back.out(3)', overwrite: true });
    if (countClick(performance.now())) window.dispatchEvent(new Event(TSURU_EVENT));
  };

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <span className="footer-hanko font-jp" aria-hidden="true" data-hanko="" onClick={stamp}>奥山</span>
        <div className="footer-text">
          <p className="footer-name">
            {profile.name} <span className="footer-kanji font-jp" lang="ja">{profile.nameKanji}</span>
          </p>
          <p className="footer-made">{currentData.footer.made}</p>
          <p className="footer-rights">
            © {new Date().getFullYear()} Raphael Okuyama. {currentData.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
