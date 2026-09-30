'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import ScrollReveal from './ScrollReveal';
import { sumiPath } from '../lib/journey/sumi';
import Section from './journey/Section';

export default function ExperienceSection({ experience, title }) {
  const refExperience = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => setIsDesktop(window.innerWidth >= 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  // Altura da timeline para desenhar a pincelada no tamanho real (sem distorcer o traço)
  const timelineRef = useRef(null);
  const [brushHeight, setBrushHeight] = useState(0);
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setBrushHeight(Math.round(entry.contentRect.height)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 歩: a pincelada sumi-e se desenha com o scroll; em cada marco uma gota de tinta se espalha
  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (brushHeight > 0 && !reduced) {
      gsap.fromTo('.sumi-stroke', { drawSVG: '0%' }, {
        drawSVG: '100%',
        ease: 'none',
        scrollTrigger: { trigger: timelineRef.current, start: 'top 65%', end: 'bottom 55%', scrub: 0.5 },
      });
      gsap.utils.toArray('.ink-drop').forEach((drop) => {
        gsap.fromTo(drop, { scale: 0, opacity: 0 }, {
          scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out',
          scrollTrigger: { trigger: drop, start: 'top 60%', toggleActions: 'play none none reverse' },
        });
      });
    }
    gsap.utils.toArray('.exp-anim').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        x: el.dataset.side === 'right' ? 20 : -20,
        duration: 0.5,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: el, start: 'top bottom', once: true },
      });
    });
  }, { scope: refExperience, dependencies: [isDesktop, experience, brushHeight], revertOnUpdate: true });

  return (
    <Section id="experience" style={{ padding: '100px 0', paddingBottom: '150px' }} ref={refExperience}>
      <ScrollReveal>
        <h2 className="section-title section-title-center">
          <span className="section-kanji font-jp" aria-hidden="true">歩</span>
          {title}
        </h2>
        
        <div ref={timelineRef} style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* PINCELADA CENTRAL (sumi-e): rastro claro + traço de tinta desenhado pelo scroll */}
          {brushHeight > 0 && (
            <svg
              className="timeline-line sumi-brush"
              aria-hidden="true"
              width="40"
              height={brushHeight}
              viewBox={`0 0 40 ${brushHeight}`}
            >
              <path className="sumi-track" d={sumiPath(brushHeight)} />
              <path className="sumi-stroke" d={sumiPath(brushHeight)} />
            </svg>
          )}

          <div className="experience-container">
            {experience.map((exp, index) => {
              const isEven = index % 2 === 0;

              return (
                <div key={exp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: isDesktop ? 'row' : 'column' }}>
                  
                  {/* ESQUERDA - Sempre alinhada à direita no desktop */}
                  <div className={`exp-col ${isDesktop ? 'exp-left' : ''}`} style={{ textAlign: isDesktop ? 'right' : 'left' }}>
                    <div className="exp-anim" data-side="left">
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
                    </div>
                  </div>

                  {/* PONTO CENTRAL */}
                  <span className="timeline-dot ink-drop" aria-hidden="true" />

                  {/* DIREITA - Sempre alinhada à esquerda no desktop */}
                  {isDesktop && (
                    <div className="exp-col exp-right" style={{ textAlign: 'left' }}>
                      <div className="exp-anim" data-side="right">
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
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </Section>
  );
}