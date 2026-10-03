'use client';
import { useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { scrollToId } from '../../lib/scroll';
import Ruby from '../Ruby';

// 山 人 技 作 歩 縁: o mapa do caminho montanha adentro. Um kanji por seção da home, aceso na seção atual
// (a mesma que a cena 3D usa); clicar leva até ela. No celular vira só o indicador da seção atual
export default function SectionRail({ sections }) {
  const current = useJourney((s) => s.section);
  const { language } = useSettings();
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
      </nav>
      {/* key: a cada troca de seção o selo reaparece por um instante e some (não cobre o conteúdo) */}
      <p key={active.id} className="section-chip" aria-hidden="true">
        <span className="font-jp">{active.kanji}</span> {label(active)}
      </p>
    </>
  );
}
