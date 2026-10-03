import Link from 'next/link';
import { Layout, Server, Code, Database, ChevronDown, GitBranch, ShieldCheck, ArrowRight } from 'lucide-react';
import { profile, resumeData } from '../data/resume';
import HeroMotion from '../components/hero/HeroMotion';
import HomeSections from '../components/HomeSections';
import Lang from '../components/Lang';
import Omikuji from '../components/hero/Omikuji';
import SectionRail from '../components/journey/SectionRail';

const { pt, en } = resumeData;

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
        <div>
          {/* Assinatura japonesa pequena (decorativa, cicla katakana ↔ hiragana) acima do nome latino fixo */}
          <p className="hero-name-jp font-jp" lang="ja" aria-hidden="true">{profile.nameKatakana}</p>
          <h1 className="hero-title">
            <span className="hero-name">{profile.name}</span>
          </h1>

          {/* As funções numa linha só, em tom neutro: o destaque fica para o nome e o CTA */}
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
            <span className="hero-available-dot" aria-hidden="true" />
            <Lang
              pt={`${pt.hero.available} ${pt.contactPage.availability.join(' · ')}`}
              en={`${en.hero.available} ${en.contactPage.availability.join(' · ')}`}
            />
          </p>
        </div>

        <Omikuji labels={{ pt: pt.hero.omikuji, en: en.hero.omikuji }} />

        <div className="hero-scroll" aria-hidden="true">
          <div className="hero-scroll-arrow">
            <ChevronDown size={22} />
          </div>
        </div>
      </HeroMotion>

      <HomeSections icons={categoryIcons} />
    </div>
  );
}
