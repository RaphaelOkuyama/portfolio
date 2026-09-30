'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { useSettings } from '../context/SettingsContext';
import { 
  Layout, Server, Code, Database, ChevronDown, 
  GitBranch, ShieldCheck, Download, CreditCard, Boxes, BarChart3
} from 'lucide-react';
import { profile } from '../data/resume';
import ScrollReveal from '../components/ScrollReveal';
import Reveal from '../components/Reveal';
import Section from '../components/journey/Section';
import { useJourney } from '../store/journey';
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

  // Entrada do hero quando o ensō termina
  useGSAP(() => {
    if (!loaderDone) return;
    gsap.from('.hero-title span', { opacity: 0, duration: 0.3, stagger: 0.08 });
    gsap.from('.hero-scroll', { opacity: 0, delay: 1, duration: 0.5 });
    gsap.to('.hero-scroll-arrow', { keyframes: { y: [0, 10, 0], easeEach: 'sine.inOut' }, duration: 2, repeat: -1 });
  }, { scope: heroRef, dependencies: [loaderDone] });

  return (
    <div className="container">
      
      <Section id="hero" className="hero-section" ref={heroRef}>
        <div>
          <h1 className="hero-title">
            {nameText.split("").map((char, index) => (
              <span key={index}>{char}</span>
            ))}
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

      <Section id="about" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 0 80px 0' }}>
        <ScrollReveal>
          <div className="responsive-grid" style={{ alignItems: 'center' }}>
            
            <div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '30px', borderLeft: '5px solid var(--accent)', paddingLeft: '20px' }}>{about.title}</h2>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '30px' }}>{about.desc}</p>
              
              <a
                href="/curriculo.pdf" 
                download="Raphael_Okuyama_CV.pdf"
                className="btn-fill"
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '10px', 
                  padding: '12px 30px', borderRadius: '50px', 
                  border: '2px solid var(--text-secondary)', 
                  color: 'var(--text-primary)', textDecoration: 'none', 
                  fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                <Download size={20} />
                {about.btnResume}
              </a>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                className="photo-tilt"
                style={{ position: 'relative', width: '100%', maxWidth: '350px', height: 'auto', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--border)' }}
              >
                <img src="/profile.jpg" alt="Raphael Okuyama" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="photo-overlay" style={{ position: 'absolute', inset: 0, background: 'var(--accent)', mixBlendMode: 'overlay' }} />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      <Section id="stack" style={{ padding: '80px 0' }}>
        <ScrollReveal>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '50px', borderLeft: '5px solid var(--accent)', paddingLeft: '20px' }}>{techData.title}</h2>
          <Reveal className="cards-grid" trigger="scroll" stagger={0.1} duration={0.5}>
            {techData.categories.map((cat, i) => (
              <div
                key={i}
                className="hover-lift"
                style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', color: 'var(--accent)' }}>
                  {categoryIcons[i]}
                  <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>{cat.name}</h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {cat.items.map((item, idx) => (
                    <span key={idx} style={{ fontSize: '0.9rem', padding: '5px 12px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-secondary)' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Reveal>
        </ScrollReveal>
      </Section>

      <ExperienceSection experience={experience} title={currentData.experienceTitle} />

    </div>
  );
}