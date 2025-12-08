'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { 
  Layout, Server, Code, Database, Terminal, Github, ChevronDown, 
  Wrench, GitBranch, Download 
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import ScrollReveal from '../components/ScrollReveal';
import ExperienceSection from '../components/ExperienceSection';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const { currentData } = useSettings();
  
  const hero = currentData?.hero || {};
  const about = currentData?.about || {};
  const experience = currentData?.experience || [];
  const techData = currentData?.techSection || { categories: [] };
  const nameText = "Raphael Nobuyuki Haga Okuyama";

  const categoryIcons = [
    <Code size={24} key="code" />, <Layout size={24} key="layout" />, 
    <Server size={24} key="server" />, <Database size={24} key="db" />, 
    <GitBranch size={24} key="git" />, <Wrench size={24} key="tools" />
  ];

  useEffect(() => {
    if (!isLoading) {
      window.scrollTo(0, 0);
      setTimeout(() => window.scrollTo(0, 0), 10);
    }
  }, [isLoading]);

  if (isLoading) return <LoadingScreen onComplete={() => setIsLoading(false)} />;

  return (
    <div className="container">
      
      {/* HERO SECTION COM CLASSE CSS (Responsiva) */}
      <section className="hero-section">
        
        {/* WRAPPER DE CONTEÚDO */}
        <div>
          {/* NOME */}
          <motion.h1 
            className="hero-title"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {nameText.split("").map((char, index) => (
              <motion.span key={index} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                {char}
              </motion.span>
            ))}
          </motion.h1>

          {/* CARGOS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
            {hero.roles && hero.roles.map((role, index) => (
              <motion.div
                key={index}
                initial="blur"
                whileHover="focus" // Mantém hover para Desktop
                whileTap="focus"   // ADICIONADO: Ativa ao clicar/segurar (Mobile)
                style={{ position: 'relative', padding: '8px 16px', cursor: 'default' }}
              >
                <motion.p 
                  variants={{
                    blur: { filter: 'blur(5px)', opacity: 0.6, scale: 1 },
                    focus: { filter: 'blur(0px)', opacity: 1, scale: 1.05 }
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', color: 'var(--accent)', fontWeight: 'bold', margin: 0 }}
                >
                  {role}
                </motion.p>

                {/* Cantoneiras */}
                <motion.div variants={{ blur: { opacity: 0 }, focus: { opacity: 1 } }} transition={{ duration: 0.2 }}>
                  <span style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '8px', borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
                  <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
                  <span style={{ position: 'absolute', bottom: 0, left: 0, width: '8px', height: '8px', borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)' }} />
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)' }} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SCROLL INDICATOR - Controlado pelo CSS agora */}
        <motion.div 
          className="hero-scroll"
          style={{ x: '-50%' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        >
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {hero.scroll}
          </span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ChevronDown size={24} />
          </motion.div>
        </motion.div>
      </section>

      {/* SOBRE MIM */}
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 0 80px 0' }}>
        <ScrollReveal>
          <div className="responsive-grid" style={{ alignItems: 'center' }}>
            
            {/* ESQUERDA */}
            <div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '30px', borderLeft: '5px solid var(--accent)', paddingLeft: '20px' }}>{about.title}</h2>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '30px' }}>{about.desc}</p>
              
              <motion.a
                href="/curriculo.pdf" 
                download="Raphael_Okuyama_CV.pdf"
                whileHover={{ scale: 1.05, backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}
                whileTap={{ scale: 0.95 }}
                style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '10px', 
                  padding: '12px 30px', borderRadius: '50px', 
                  border: '2px solid var(--text-secondary)', 
                  color: 'var(--text-primary)', textDecoration: 'none', 
                  fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s' 
                }}
              >
                <Download size={20} />
                {about.btnResume}
              </motion.a>
            </div>

            {/* DIREITA */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                style={{ position: 'relative', width: '100%', maxWidth: '350px', height: 'auto', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--border)' }}
              >
                <img src="/profile.jpg" alt="Raphael Okuyama" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <motion.div style={{ position: 'absolute', inset: 0, background: 'var(--accent)', mixBlendMode: 'overlay', opacity: 0 }} whileHover={{ opacity: 0.2 }} />
              </motion.div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* TECNOLOGIAS */}
      <section style={{ padding: '80px 0' }}>
        <ScrollReveal>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '50px', borderLeft: '5px solid var(--accent)', paddingLeft: '20px' }}>{techData.title}</h2>
          <div className="cards-grid">
            {techData.categories.map((cat, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, borderColor: 'var(--accent)' }}
                style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '15px', border: '1px solid var(--border)', transition: '0.3s' }}
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
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* EXPERIÊNCIA */}
      <ExperienceSection experience={experience} title={currentData.experienceTitle} />

    </div>
  );
}