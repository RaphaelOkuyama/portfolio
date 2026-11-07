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
