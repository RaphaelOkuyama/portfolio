'use client';
import { useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { STATIONS } from '../../lib/stations';

// Tablet e celular (sem o trilho lateral): a seção atual da home num selo na navbar, logo depois do
// nome. Kanji na cor da estação (--season, do SectionRail) e o nome quando há espaço (o CSS esconde
// por container query). No topo (山) não aparece: o nome do site já diz onde se está
export default function SectionChip() {
  const current = useJourney((s) => s.section);
  const { language } = useSettings();
  const station = STATIONS.find((s) => s.id === current);

  return (
    <div className="nav-section" aria-hidden="true">
      {station && station.id !== 'hero' ? (
        // key: a cada troca de seção o selo entra de novo
        <p key={station.id} className="nav-section-chip">
          <span className="nav-section-kanji font-jp">{station.kanji}</span>
          <span className="nav-section-label">{station[language] ?? station.pt}</span>
        </p>
      ) : null}
    </div>
  );
}
