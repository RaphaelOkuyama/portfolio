import Link from 'next/link';
import { Layout, Server, Code, Database, ChevronDown, GitBranch, ShieldCheck, ArrowRight } from 'lucide-react';
import { profile, resumeData } from '../data/resume';
import HeroMotion from '../components/hero/HeroMotion';
import HomeSections from '../components/HomeSections';
import Lang from '../components/Lang';
import Omikuji from '../components/hero/Omikuji';
import SectionRail from '../components/journey/SectionRail';

const { pt, en } = resumeData;
// Nome em dois tamanhos: os nomes dados em cima e o sobrenome 奥山 (Okuyama) grande
const NAME_PARTS = profile.name.split(' ');
const FAMILY_NAME = NAME_PARTS.at(-1);
const GIVEN_NAMES = NAME_PARTS.slice(0, -1).join(' ');

// Server Component: o hero (LCP) e os ícones saem prontos do servidor, sem hidratação;
// só o movimento (HeroMotion) e as seções animadas (HomeSections) rodam no cliente
export default function Home() {
  // Ícones das 6 áreas do Stack (mesma ordem do resume.js)
  const categoryIcons = [
    <Code size={24} key="code" />,
    <Layout size={24} key="front" />,
    <Server size={24} key="back" />,
    <Database size={24} key="data" />,
    <ShieldCheck size={24} key="quality" />,
    <GitBranch size={24} key="devops" />,
  ];

  // Mapa do caminho montanha adentro: um kanji por seção (os mesmos dos títulos)
  const sections = [
    { id: 'hero', kanji: '山', pt: 'Início', en: 'Top' },
    { id: 'about', kanji: '人', pt: pt.about.title, en: en.about.title },
    { id: 'stack', kanji: '技', pt: pt.techSection.title, en: en.techSection.title },
    { id: 'projects', kanji: '作', pt: pt.projectsPage.title, en: en.projectsPage.title },
    { id: 'experience', kanji: '歩', pt: pt.experienceTitle, en: en.experienceTitle },
    { id: 'contato', kanji: '縁', pt: pt.contactPage.title, en: en.contactPage.title },
  ];

  return (
    <div className="container">
      <SectionRail sections={sections} />
      <HeroMotion>
        {/* Bloco do texto à esquerda (o torii fica no terço direito da cena). As pétalas evitam este
            retângulo (ver HeroMotion e FallingLeaves) */}
        <div className="hero-copy">
          {/* Assinatura japonesa pequena (decorativa, cicla katakana ↔ hiragana) acima do nome */}
          <p className="hero-name-jp font-jp" lang="ja" aria-hidden="true">{profile.nameKatakana}</p>
          {/* 奥山 em pé ao lado do nome, como um selo: a montanha que dá nome ao site */}
          <div className="hero-lockup">
            <p className="hero-okuyama font-jp" lang="ja" aria-hidden="true">奥山</p>
            <h1 className="hero-title">
              <span className="hero-name">
                <span className="hero-name-given">{GIVEN_NAMES}</span>{' '}
                <span className="hero-name-family">{FAMILY_NAME}</span>
              </span>
            </h1>
          </div>

          <p className="hero-roles">
            {pt.hero.roles.map((role, index) => (
              <span key={role} className="hero-role">
                <Lang pt={role} en={en.hero.roles[index]} />
              </span>
            ))}
          </p>

          <p className="hero-summary">
            <Lang pt={pt.hero.summary} en={en.hero.summary} />
          </p>
          <div className="hero-actions">
            <Link href="/#projects" className="hero-cta is-primary">
              <Lang pt={pt.hero.ctaProjects} en={en.hero.ctaProjects} /> <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/#contato" className="hero-cta">
              <Lang pt={pt.hero.ctaContact} en={en.hero.ctaContact} />
            </Link>
          </div>
          <p className="hero-available">
            <Lang
              pt={`${pt.hero.available} ${pt.contactPage.availability.join(' · ')}`}
              en={`${en.hero.available} ${en.contactPage.availability.join(' · ')}`}
            />
          </p>
        </div>

        <Omikuji labels={{ pt: pt.hero.omikuji, en: en.hero.omikuji }} />

        <div className="hero-scroll">
          <div className="hero-scroll-arrow" aria-hidden="true">
            <ChevronDown size={22} />
          </div>
          <p className="hero-scroll-cue">
            <Lang pt={pt.hero.scrollCue} en={en.hero.scrollCue} />
          </p>
        </div>
      </HeroMotion>

      <HomeSections icons={categoryIcons} />
    </div>
  );
}
