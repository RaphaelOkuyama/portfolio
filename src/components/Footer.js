'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { profile } from '../data/resume';
import { gsap, SplitText, useGSAP } from '../lib/gsap';
import { createClickCounter, TSURU_EVENT } from '../lib/easterEgg';
import { cityTime, scrollToTop } from '../lib/scroll';
import { microseasonFor } from '../lib/microseasons';

const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com/RaphaelOkuyama' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/raphael-okuyama/' },
  { label: 'E-mail', href: 'mailto:raphaelokuyama123@gmail.com' },
];

const CLOCKS = [
  { key: 'saoPaulo', zone: 'America/Sao_Paulo' },
  { key: 'tokyo', zone: 'Asia/Tokyo', jp: '東京' },
];

const WORDMARK = 'OKUYAMA';

// Relógios das duas origens; só no cliente (o horário do servidor não bate com o do visitante)
function useClocks() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Assinatura do maior tamanho que cabe na sobra do rodapé: na largura (descontando o 奥山
// vertical ao lado) e na altura (o rodapé tem a altura da tela). Mede numa fonte de referência
// e escala; refaz ao redimensionar e quando a fonte carrega
function useFitWordmark(rootRef) {
  useEffect(() => {
    const wrap = rootRef.current?.querySelector('.sf-wordmark');
    const text = wrap?.querySelector('.sf-wordmark-text');
    if (!wrap || !text) return undefined;
    const kanji = wrap.querySelector('.sf-wordmark-kanji');
    const fit = () => {
      const height = wrap.clientHeight;
      // O 奥山 vertical (dois kanji em pé) também precisa caber na altura
      if (kanji && height > 0) {
        kanji.style.fontSize = '';
        const max = parseFloat(getComputedStyle(kanji).fontSize);
        kanji.style.fontSize = `${Math.max(14, Math.min(max, height / 2.4))}px`;
      }
      const gap = parseFloat(getComputedStyle(wrap).columnGap) || 0;
      const side = kanji && getComputedStyle(kanji).display !== 'none' ? kanji.offsetWidth + gap : 0;
      const available = wrap.clientWidth - side;
      text.style.fontSize = '100px';
      const box = text.getBoundingClientRect();
      if (!box.width || available <= 0) return;
      const byWidth = (100 * available) / box.width;
      const byHeight = height > 0 && box.height > 0 ? (100 * height) / box.height : Infinity;
      text.style.fontSize = `${Math.floor(Math.min(byWidth, byHeight))}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [rootRef]);
}

// Rodapé como a última página do emakimono: fecho, navegação, relógios Brasil/Japão
// e a assinatura OKUYAMA de ponta a ponta, com o hanko 奥山 (easter egg) ao lado
export default function Footer() {
  const { currentData, language } = useSettings();
  const t = currentData.footer;
  const nav = currentData.nav;
  const now = useClocks();
  // 七十二候: a microestação de agora no Japão (só no cliente, como os relógios)
  const season = now ? microseasonFor(now) : null;
  const rootRef = useRef(null);
  const countClick = useMemo(() => createClickCounter(5, 2500), []);
  useFitWordmark(rootRef);

  // Cada clique carimba; o quinto seguido solta o bando de tsurus (千羽鶴)
  const stamp = (e) => {
    gsap.fromTo(e.currentTarget, { scale: 0.86 }, { scale: 1, duration: 0.35, ease: 'back.out(3)', overwrite: true });
    if (countClick(performance.now())) window.dispatchEvent(new Event(TSURU_EVENT));
  };

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    // A assinatura sobe letra a letra quando o rodapé entra na tela
    gsap.from('.sf-wordmark-letter', {
      yPercent: 105,
      duration: 1.1,
      stagger: 0.06,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.sf-wordmark', start: 'top 92%' },
    });
    // aria: 'none': aria-label é proibido em <p>; as linhas continuam legíveis como texto
    const lead = SplitText.create('.sf-lead', { type: 'lines', mask: 'lines', linesClass: 'sf-lead-line', aria: 'none' });
    gsap.from(lead.lines, {
      yPercent: 110,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.sf-lead', start: 'top 90%' },
    });
    return () => lead.revert();
  }, { scope: rootRef });

  return (
    <footer ref={rootRef} className="site-footer">
      <div className="sf-inner container">
        <div className="sf-top">
          <p className="sf-lead">{t.lead}</p>
          <button type="button" className="sf-top-btn" onClick={scrollToTop}>
            <span className="sf-top-icon" aria-hidden="true"><ArrowUp size={18} /></span>
            {t.top}
          </button>
        </div>

        <div className="sf-grid">
          <nav aria-label={t.navTitle}>
            <h2 className="sf-heading">{t.navTitle}</h2>
            <ul className="sf-list">
              <li><Link href="/" className="sf-link">{nav.home}</Link></li>
              <li><Link href="/projects" className="sf-link">{nav.projects}</Link></li>
              <li><Link href="/certificates" className="sf-link">{nav.certificates}</Link></li>
              <li><Link href="/#contato" className="sf-link">{nav.contact}</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="sf-heading">{t.socialTitle}</h2>
            <ul className="sf-list">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="sf-link"
                    {...(s.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {s.label} <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="sf-heading">{t.timeTitle}</h2>
            <ul className="sf-list sf-clocks">
              {CLOCKS.map((c) => (
                <li key={c.key}>
                  <span className="sf-city">
                    {t.cities[c.key]}
                    {c.jp ? <span className="font-jp" lang="ja"> {c.jp}</span> : null}
                  </span>
                  <time className="sf-time" data-clock={c.key} suppressHydrationWarning>
                    {now ? cityTime(c.zone, now) : '--:--'}
                  </time>
                </li>
              ))}
            </ul>
            {season && (
              <p className="sf-season" data-microseason="">
                <span className="sf-season-label">{t.seasonLabel}</span>
                <span className="sf-season-kanji font-jp" lang="ja">{season.kanji}</span>
                <span className="sf-season-text">
                  {season[language] ?? season.pt}
                  <span className="sf-season-reading"> · {season.reading}</span>
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Assinatura de ponta a ponta: cada letra se enche de tinta sob o cursor */}
        <div className="sf-wordmark" aria-hidden="true">
          <span className="sf-wordmark-text">
            {WORDMARK.split('').map((letter, i) => (
              <span key={i} className="sf-wordmark-mask">
                <span className="sf-wordmark-letter">{letter}</span>
              </span>
            ))}
          </span>
          <span className="sf-wordmark-kanji font-jp">奥山</span>
        </div>

        <div className="sf-bottom">
          <span className="footer-hanko font-jp" aria-hidden="true" data-hanko="" onClick={stamp}>奥山</span>
          <p className="sf-name">
            {profile.name} <span className="font-jp" lang="ja">{profile.nameKanji}</span>
          </p>
          <p className="sf-rights">
            © {new Date().getFullYear()} Raphael Okuyama. {t.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
