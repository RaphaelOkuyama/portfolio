'use client';
import { useSettings } from '../../context/SettingsContext';
import { LINE, TERMINUS, stationFor } from '../../lib/stations';
import { scrollToId } from '../../lib/scroll';
import Ruby from '../Ruby';
import Tate from '../Tate';

// 駅名標: o título da seção como placa de estação de trem japonesa. No alto o número da estação e
// a linha; no meio o título (o mesmo h2 de antes); embaixo a faixa da linha, na cor da estação do
// ano, com a estação anterior e a próxima (clicáveis: levam até elas)
export default function StationSign({ id, kanji, title, tate }) {
  const { language } = useSettings();
  const station = stationFor(id);
  const label = (s) => s[language] ?? s.pt;
  const go = (e, target) => {
    e.preventDefault();
    scrollToId(target);
    history.replaceState(null, '', target === 'hero' ? window.location.pathname : `#${target}`);
  };
  const t = language === 'en'
    ? { prev: 'Previous station', next: 'Next station', line: 'Line' }
    : { prev: 'Estação anterior', next: 'Próxima estação', line: 'Linha' };

  return (
    <div className="station" data-station={id}>
      <p className="station-line" aria-label={`${t.line} ${label(LINE)}, ${station.number}`}>
        <span className="station-number" aria-hidden="true">
          <span>{LINE.code}</span>
          <span>{station.number.slice(-2)}</span>
        </span>
        <span className="font-jp" lang="ja" aria-hidden="true">{LINE.kanji}</span>
        <span className="station-line-name" aria-hidden="true">{label(LINE)}</span>
      </p>
      <h2 className="section-title">
        <span className="section-kanji font-jp" aria-hidden="true"><Ruby>{kanji}</Ruby></span>
        <span className="section-title-text">{title}<Tate>{tate}</Tate></span>
      </h2>
      <nav className="station-bar" aria-label={label(LINE)}>
        {station.prev ? (
          <a href={`#${station.prev.id}`} className="station-prev" aria-label={`${t.prev}: ${label(station.prev)}`} onClick={(e) => go(e, station.prev.id)}>
            <span aria-hidden="true">←</span>
            <span className="font-jp" aria-hidden="true">{station.prev.kanji}</span>
            <span aria-hidden="true">{label(station.prev)}</span>
          </a>
        ) : <span />}
        {station.next ? (
          <a href={`#${station.next.id}`} className="station-next" aria-label={`${t.next}: ${label(station.next)}`} onClick={(e) => go(e, station.next.id)}>
            <span aria-hidden="true">{label(station.next)}</span>
            <span className="font-jp" aria-hidden="true">{station.next.kanji}</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : (
          <span className="station-next is-terminus">
            <span className="font-jp" aria-hidden="true">{TERMINUS.kanji}</span>
            <span>{label(TERMINUS)}</span>
          </span>
        )}
      </nav>
    </div>
  );
}
