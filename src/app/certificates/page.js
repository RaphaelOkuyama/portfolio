import { Award, ExternalLink } from 'lucide-react';
import { resumeData } from '../../data/resume';
import { groupByArea, summaryText } from '../../lib/certificates';
import { TOOL_ICONS } from '../../components/stack/toolIcons';
import CertificateBoard from '../../components/certificates/CertificateBoard';
import Lang from '../../components/Lang';

export const metadata = {
  title: 'Certificados',
  description: 'Bootcamps, formação e cursos de Raphael Okuyama em front-end, back-end, dados e fundamentos.',
};

function CertIcon({ icon }) {
  const Icon = icon === 'award' ? Award : TOOL_ICONS[icon];
  return <span className="cert-icon" aria-hidden="true">{Icon ? <Icon size={20} /> : null}</span>;
}

// Um item da lista: certificado avulso (link "Ver certificado") ou trilha (um link por módulo)
function CertItem({ cert, labels }) {
  return (
    <li className="cert-item">
      <CertIcon icon={cert.icon} />
      <div className="cert-body">
        <h3 className="cert-name">{cert.name}</h3>
        <p className="cert-inst">
          {cert.institution}
          {cert.modules && <> · {cert.modules.length} {labels.modules}</>}
        </p>
        {cert.modules && (
          <ul className="cert-modules">
            {cert.modules.map((m) => (
              <li key={m.link}>
                <a href={m.link} target="_blank" rel="noopener noreferrer" aria-label={`${labels.btnView}: ${cert.name}, ${m.label}`}>
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!cert.modules && (
        <a className="cert-view" href={cert.link} target="_blank" rel="noopener noreferrer" aria-label={`${labels.btnView}: ${cert.name}`}>
          <span className="cert-view-text">{labels.btnView}</span>
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      )}
    </li>
  );
}

// Lista de um idioma: um bloco por área, com o carimbo 証 no título de cada uma
function CertificateList({ lang }) {
  const { certificates, certificatesPage: labels } = resumeData[lang];
  return (
    <div data-lang={lang}>
      {groupByArea(certificates).map((group) => (
        <section key={group.area} className="cert-group" data-area={group.area} aria-labelledby={`cert-${lang}-${group.area}`}>
          <h2 id={`cert-${lang}-${group.area}`} className="cert-group-title">
            {labels.areas[group.area]}
            <span className="cert-group-count">{group.count}</span>
            <span className="cert-hanko font-jp" aria-hidden="true">証</span>
          </h2>
          <ul className="cert-list">
            {group.items.map((cert) => <CertItem key={cert.id} cert={cert} labels={labels} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

// 証 Certificados: Server Component. Os dois idiomas saem prontos no HTML (o CSS mostra o do
// <html lang>); só os filtros e o carimbo (CertificateBoard) rodam no navegador
export default function CertificatesPage() {
  const { pt, en } = resumeData;
  const filters = groupByArea(pt.certificates).map((group, i) => ({
    area: group.area,
    count: group.count,
    pt: pt.certificatesPage.areas[group.area],
    en: en.certificatesPage.areas[groupByArea(en.certificates)[i].area],
  }));

  return (
    <div className="container cert-page">
      <h1 className="responsive-title section-title">
        <span className="section-kanji font-jp" aria-hidden="true">証</span>
        <Lang pt={pt.certificatesPage.title} en={en.certificatesPage.title} />
      </h1>
      <p className="cert-summary">
        <Lang
          pt={summaryText(pt.certificatesPage.summary, pt.certificates)}
          en={summaryText(en.certificatesPage.summary, en.certificates)}
        />
      </p>

      <CertificateBoard
        filters={filters}
        all={{ pt: pt.certificatesPage.filterAll, en: en.certificatesPage.filterAll }}
        filterLabel={{ pt: pt.certificatesPage.filterLabel, en: en.certificatesPage.filterLabel }}
        total={filters.reduce((n, f) => n + f.count, 0)}
      >
        <CertificateList lang="pt" />
        <CertificateList lang="en" />
      </CertificateBoard>
    </div>
  );
}
