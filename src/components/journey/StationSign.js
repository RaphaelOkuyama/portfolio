'use client';
import { useSettings } from '../../context/SettingsContext';
import { stationFor } from '../../lib/stations';
import Ruby from '../Ruby';
import Tate from '../Tate';

// 丁石: o título de cada seção ao lado de um marco de pedra dos caminhos de peregrinação, com quantos
// chō faltam até o santuário (o Contato é o 奥の院, o fim do caminho). O h2 é o mesmo de antes;
// data-station e .section-kanji continuam (o segredo do 技 escuta o kanji da Stack)
export default function StationSign({ id, kanji, title, tate }) {
  const { language } = useSettings();
  const station = stationFor(id);
  const left = station?.left?.[language] ?? station?.left?.pt;

  return (
    <div className="station" data-station={id}>
      {station ? (
        <p className="choishi font-jp" lang="ja" aria-hidden="true">
          {/* O marco desenhado a nanquim: o gorintō (joia, meia-lua, telhado, esfera) sobre o
              pilar onde o número está gravado, como os chōishi de Kōyasan */}
          <svg className="choishi-stone" viewBox="0 0 40 100" focusable="false">
            <path d="M20 2C23.6 5.6 25.8 8.6 25 11.4Q20 12.8 15 11.4C14.2 8.6 16.4 5.6 20 2Z" />
            <path d="M12.6 12.6H27.4Q27 18.6 20 18.6Q13 18.6 12.6 12.6Z" />
            <path d="M6 27.2Q14 25.4 20 18.4Q26 25.4 34 27.2Z" />
            <circle cx="20" cy="33.6" r="6.4" />
            <rect className="choishi-pillar" x="9" y="40" width="22" height="57.5" rx="0.8" />
            <path className="choishi-ground" d="M3 98.2H37" />
          </svg>
          <span className="choishi-mark">{station.marker}</span>
        </p>
      ) : null}
      <div className="station-text">
        <h2 className="section-title">
          <span className="section-kanji font-jp" aria-hidden="true"><Ruby>{kanji}</Ruby></span>
          <span className="section-title-text">{title}<Tate>{tate}</Tate></span>
        </h2>
        {left ? <p className="choishi-left">{left}</p> : null}
      </div>
    </div>
  );
}
