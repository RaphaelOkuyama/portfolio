'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

export default function ExperienceSection({ experience, title }) {
  const refExperience = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => setIsDesktop(window.innerWidth >= 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  const { scrollYProgress } = useScroll({ target: refExperience, offset: ["start center", "end center"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <section style={{ padding: '100px 0', paddingBottom: '150px' }} ref={refExperience}>
      <ScrollReveal>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '80px', textAlign: 'center' }}>{title}</h2>
        
        <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* LINHA CENTRAL */}
          <div className="timeline-line" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '4px', background: 'var(--border)', transform: 'translateX(-50%)', borderRadius: '4px' }}>
            <motion.div style={{ width: '100%', background: 'var(--accent)', transformOrigin: 'top', scaleY: scaleY, height: '100%' }} />
          </div>

          <div className="experience-container">
            {experience.map((exp, index) => {
              const isEven = index % 2 === 0;

              return (
                <div key={exp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: isDesktop ? 'row' : 'column' }}>
                  
                  {/* ESQUERDA - Sempre alinhada à direita no desktop */}
                  <div className={`exp-col ${isDesktop ? 'exp-left' : ''}`} style={{ textAlign: isDesktop ? 'right' : 'left' }}>
                    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                      {(!isDesktop || isEven) ? (
                        // PAR: INFO (Com padding extra para alinhar com o texto do card)
                        <div style={{ paddingRight: isDesktop ? '20px' : '0' }}> 
                          <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>{exp.company}</h3>
                          <h4 style={{ fontSize: '1.1rem', color: 'var(--accent)', margin: '5px 0' }}>{exp.role}</h4>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{exp.year}</span>
                          {!isDesktop && (
                             <p style={{ marginTop: '15px', fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{exp.desc}</p>
                          )}
                        </div>
                      ) : (
                        // ÍMPAR: CARD (Texto dentro já tem padding de 20px do próprio card)
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-secondary)', background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left' }}>
                          {exp.desc}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {/* PONTO CENTRAL */}
                  <div className="timeline-dot" style={{ width: '20px', height: '20px', background: 'var(--accent)', borderRadius: '50%', border: '4px solid var(--bg-color)', zIndex: 10, flexShrink: 0 }} />

                  {/* DIREITA - Sempre alinhada à esquerda no desktop */}
                  {isDesktop && (
                    <div className="exp-col exp-right" style={{ textAlign: 'left' }}>
                      <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        {isEven ? (
                          // PAR: CARD
                          <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-secondary)', background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'left' }}>
                            {exp.desc}
                          </p>
                        ) : (
                          // ÍMPAR: INFO (Com padding extra para alinhar com o texto do card)
                          <div style={{ paddingLeft: '20px' }}>
                            <h3 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--text-primary)' }}>{exp.company}</h3>
                            <h4 style={{ fontSize: '1.2rem', color: 'var(--accent)', margin: '5px 0' }}>{exp.role}</h4>
                            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{exp.year}</span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}