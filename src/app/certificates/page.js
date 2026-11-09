import { Award, Eye } from 'lucide-react';
import { resumeData } from '../../data/resume';
import { groupByArea, summaryText, certKey, certDate, certHours, viewerEntries, degreeDone } from '../../lib/certificates';
import { formatMonth } from '../../lib/experience';
import { TOOL_ICONS } from '../../components/stack/toolIcons';
import CertificateBoard from '../../components/certificates/CertificateBoard';
import Lang from '../../components/Lang';

export const metadata = {
  title: 'Certificados',
  description: 'Formação em Engenharia de Computação, bootcamps e cursos de Raphael Okuyama em front-end, back-end, dados e fundamentos.',
};

function CertIcon({ icon }) {
  const Icon = icon === 'award' ? Award : TOOL_ICONS[icon];
  return <span className="cert-icon" aria-hidden="true">{Icon ? <Icon size={20} /> : null}</span>;
}

const ratio = (image) => (image.width / image.height).toFixed(3);

// Período da trilha: do primeiro ao último módulo
function moduleSpan(modules, lang) {
  const dates = modules.map((m) => m.date).sort();
  const first = formatMonth(dates[0], lang);
  const last = formatMonth(dates.at(-1), lang);
  return first === last ? last : `${first} – ${last}`;
}

// Um item da lista: certificado avulso ("Ver certificado") ou trilha (um botão por módulo).
// Os botões levam à imagem do certificado; com JavaScript, abrem o visualizador na página
function CertItem({ cert, labels, lang }) {
  const when = cert.modules ? moduleSpan(cert.modules, lang) : formatMonth(certDate(cert), lang);
  return (
    <li
      className="cert-item"
      {...(cert.modules ? {} : { 'data-peek': cert.image.src, 'data-peek-ratio': ratio(cert.image) })}
    >
      <CertIcon icon={cert.icon} />
      <div className="cert-body">
        <h3 className="cert-name">{cert.name}</h3>
        <p className="cert-inst">
          {cert.institution}
          {cert.modules && <> · {cert.modules.length} {labels.modules}</>}
          <span className="cert-when"> · {when} · {certHours(cert)}h</span>
        </p>
        {cert.modules && (
          <ul className="cert-modules">
            {cert.modules.map((m, i) => (
              <li key={m.image.src}>
                <a
                  href={m.image.src}
                  target="_blank"
                  rel="noopener"
                  data-cert={certKey(cert, i)}
                  data-peek={m.image.src}
                  data-peek-ratio={ratio(m.image)}
                  aria-label={`${labels.btnView}: ${cert.name}, ${m.label}`}
                >
                  {m.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!cert.modules && (
        <a
          className="cert-view"
          href={cert.image.src}
          target="_blank"
          rel="noopener"
          data-cert={certKey(cert)}
          aria-label={`${labels.btnView}: ${cert.name}`}
        >
          <span className="cert-view-text">{labels.btnView}</span>
          <Eye size={16} aria-hidden="true" />
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
            {group.items.map((cert) => <CertItem key={cert.id} cert={cert} labels={labels} lang={lang} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

// 学 A graduação antes dos cursos: a credencial mais forte. O selo em japonês é o do 履歴書
// (currículo japonês): 卒業見込 enquanto a conclusão é prevista, 卒業 depois dela
function DegreeCard({ lang }) {
  const { education, certificatesPage: labels } = resumeData[lang];
  const done = degreeDone(education.end);
  return (
    <section className="cert-degree" data-lang={lang} aria-labelledby={`degree-${lang}`}>
      <span className="cert-degree-kanji font-jp" aria-hidden="true">学</span>
      <div className="cert-degree-body">
        <p className="cert-degree-eyebrow">{labels.degreeTitle}</p>
        <h2 id={`degree-${lang}`} className="cert-degree-course">{education.course}</h2>
        <p className="cert-degree-summary">{education.summary}</p>
        <p className="cert-degree-when">
          {done ? labels.degreeDone : labels.degreeExpected}: <strong>{formatMonth(education.end, lang)}</strong>
        </p>
      </div>
      <span className="cert-degree-stamp font-jp" lang="ja" aria-hidden="true">{done ? '卒業' : '卒業見込'}</span>
    </section>
  );
}

// 証 Certificados: Server Component. Os dois idiomas saem prontos no HTML (o CSS mostra o do
// <html lang>); só os filtros, a prévia e o visualizador (CertificateBoard) rodam no navegador
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

      <DegreeCard lang="pt" />
      <DegreeCard lang="en" />

      <CertificateBoard
        filters={filters}
        all={{ pt: pt.certificatesPage.filterAll, en: en.certificatesPage.filterAll }}
        filterLabel={{ pt: pt.certificatesPage.filterLabel, en: en.certificatesPage.filterLabel }}
        total={filters.reduce((n, f) => n + f.count, 0)}
        entries={{ pt: viewerEntries(pt.certificates), en: viewerEntries(en.certificates) }}
        viewerLabels={{ pt: pt.certificatesPage.viewer, en: en.certificatesPage.viewer }}
      >
        <CertificateList lang="pt" />
        <CertificateList lang="en" />
      </CertificateBoard>
    </div>
  );
}
