'use client';
import { useEffect } from 'react';
import { journeyStore, useJourney } from '../../store/journey';
import { inkOn, seasonInk } from '../../lib/dentoushoku';
import { useSettings } from '../../context/SettingsContext';
import { scrollToId } from '../../lib/scroll';
import Ruby from '../Ruby';

// Degraus da cor da estação por estação (ver o efeito do --season)
const INK_STEPS = 12;

// 山 人 技 作 歩 縁: o mapa do caminho montanha adentro. Um kanji por seção da home, aceso na seção atual
// (a mesma que a cena 3D usa); clicar leva até ela. No celular vira só o indicador da seção atual
export default function SectionRail({ sections }) {
  const current = useJourney((s) => s.section);
  // Só a estação mais próxima (nome da cor): o React não re-renderiza a cada quadro da rolagem
  const nearest = useJourney((s) => Math.round(s.seasonMix));
  const theme = useJourney((s) => s.theme);
  const { language } = useSettings();
  const ink = seasonInk(theme, nearest);
  // 伝統色: a cor tradicional da estação em que a câmera está tinge os kanji das seções. A mistura
  // contínua entre estações vai direto para a variável CSS, fora do React, em degraus de 1/12 de
  // estação: a variável fica no <html>, e cada troca recalcula o estilo da página inteira (antes
  // era a cada quadro da rolagem, o maior custo de CPU ao rolar no celular)
  useEffect(() => {
    const root = document.documentElement.style;
    let last = '';
    const apply = ({ theme: t, seasonMix }) => {
      const { hex } = seasonInk(t, Math.round(seasonMix * INK_STEPS) / INK_STEPS);
      if (hex === last) return;
      last = hex;
      root.setProperty('--season', hex);
      root.setProperty('--season-on', inkOn(hex));
    };
    apply(journeyStore.getState());
    const unsubscribe = journeyStore.subscribe(apply);
    return () => {
      unsubscribe();
      root.removeProperty('--season');
      root.removeProperty('--season-on');
    };
  }, []);
  const label = (s) => s[language] ?? s.pt;
  const active = sections.find((s) => s.id === current) ?? sections[0];

  const go = (e, id) => {
    e.preventDefault();
    scrollToId(id);
    history.replaceState(null, '', id === 'hero' ? window.location.pathname : `#${id}`);
  };

  return (
    <>
      {/* No emakimono (largura total) o trilho fica por cima dos painéis: esmaece até o mouse chegar */}
      <nav
        className="section-rail"
        data-dim={current === 'projects' || undefined}
        aria-label={label({ pt: 'Seções da página', en: 'Page sections' })}
      >
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="section-rail-link"
                aria-current={s.id === current ? 'location' : undefined}
                onClick={(e) => go(e, s.id)}
              >
                <span className="section-rail-kanji font-jp" aria-hidden="true"><Ruby>{s.kanji}</Ruby></span>
                <span className="section-rail-label">{label(s)}</span>
              </a>
            </li>
          ))}
        </ol>
        {/* O nome da cor, em 縦書き, embaixo do trilho */}
        <p className="section-rail-ink" data-season-ink={ink.reading}>
          <span className="section-rail-swatch" aria-hidden="true" />
          <span className="font-jp" lang="ja">{ink.kanji}</span>
          <span className="section-rail-ink-name">{ink.reading} · {ink[language] ?? ink.pt}</span>
        </p>
      </nav>
      {/* key: a cada troca de seção o selo reaparece por um instante e some (não cobre o conteúdo) */}
      <p key={active.id} className="section-chip" aria-hidden="true">
        <span className="font-jp">{active.kanji}</span> {label(active)}
      </p>
    </>
  );
}
