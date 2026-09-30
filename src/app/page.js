'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useSettings } from '../context/SettingsContext';
import { 
  Layout, Server, Code, Database, ChevronDown, 
  GitBranch, ShieldCheck, CreditCard, Boxes, BarChart3
} from 'lucide-react';
import { profile } from '../data/resume';
import AboutSection from '../components/about/AboutSection';
import ZenStack from '../components/stack/ZenStack';
import EmakiProjects from '../components/projects/EmakiProjects';
import ContactSection from '../components/contact/ContactSection';
import Section from '../components/journey/Section';
import { useJourney } from '../store/journey';
import { buildNameSequence, SCRAMBLE_CHARS, NAME_HOLD_SECONDS, NAME_SCRAMBLE_SECONDS } from '../lib/hero/name';
import ExperienceSection from '../components/ExperienceSection';

export default function Home() {
  const { currentData } = useSettings();
  
  const hero = currentData?.hero || {};
  const about = currentData?.about || {};
  const experience = currentData?.experience || [];
  const techData = currentData?.techSection || { categories: [] };
  const nameText = profile.name;

  // ÍCONES DAS 9 CATEGORIAS DE TECNOLOGIAS (mesma ordem do resume.js)
  const categoryIcons = [
    <Code size={24} key="code" />,
    <Layout size={24} key="layout" />,
    <Server size={24} key="server" />,
    <Database size={24} key="db" />,
    <CreditCard size={24} key="payments" />,
    <GitBranch size={24} key="devops" />,
    <Boxes size={24} key="arch" />,
    <ShieldCheck size={24} key="security" />,
    <BarChart3 size={24} key="data" />
  ];

  const heroRef = useRef(null);

  const loaderDone = useJourney((s) => s.loaderDone);

  // O nome fica visível desde o HTML do servidor (é o LCP): o fade do ensō já o revela.
  // Quando o loader termina, entra a seta de scroll e o nome cicla latino → katakana → kanji.
  useGSAP(() => {
    if (!loaderDone) {
      gsap.set('.hero-scroll', { autoAlpha: 0 });
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.to('.hero-scroll', { autoAlpha: 1, delay: reduced ? 0 : 1, duration: reduced ? 0 : 0.5 });
    if (reduced) return;

    gsap.to('.hero-scroll-arrow', { keyframes: { y: [0, 10, 0], easeEach: 'sine.inOut' }, duration: 2, repeat: -1 });

    const cycle = gsap.timeline({ repeat: -1, delay: NAME_HOLD_SECONDS });
    buildNameSequence(profile).forEach((text) => {
      cycle
        .to('.hero-name', {
          duration: NAME_SCRAMBLE_SECONDS,
          scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5, revealDelay: 0.3 },
        })
        .to({}, { duration: NAME_HOLD_SECONDS });
    });
  }, { scope: heroRef, dependencies: [loaderDone] });

  return (
    <div className="container">
      
      <Section id="hero" className="hero-section" ref={heroRef}>
        <div>
          <h1 className="hero-title">
            {/* Leitores de tela e SEO sempre recebem o nome latino */}
            <span className="sr-only">{nameText}</span>
            <span className="hero-name" aria-hidden="true">{nameText}</span>
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
            {hero.roles && hero.roles.map((role, index) => (
              <div
                key={index}
                className="role-chip"
                style={{ position: 'relative', padding: '8px 16px', cursor: 'default' }}
              >
                <p
                  style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', color: 'var(--accent)', fontWeight: 'bold', margin: 0 }}
                >
                  {role}
                </p>

                <div className="role-corners">
                  <span style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '8px', borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
                  <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
                  <span style={{ position: 'absolute', bottom: 0, left: 0, width: '8px', height: '8px', borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-scroll">
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {hero.scroll}
          </span>
          <div className="hero-scroll-arrow">
            <ChevronDown size={24} />
          </div>
        </div>
      </Section>

      <AboutSection about={about} />

      <ZenStack techData={techData} icons={categoryIcons} />

      <EmakiProjects projects={currentData.projects} labels={currentData.projectsPage} />

      <ExperienceSection experience={experience} title={currentData.experienceTitle} />

      <ContactSection contact={currentData.contactPage} />

    </div>
  );
}