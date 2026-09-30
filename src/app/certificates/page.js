'use client';
import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { useSettings } from '../../context/SettingsContext';
import { CheckCircle, ExternalLink, Award } from 'lucide-react';
import { FaReact, FaNodeJs, FaHtml5, FaCss3Alt, FaGitAlt, FaGithub, FaBootstrap, FaSass } from 'react-icons/fa';
import { SiJavascript, SiTypescript, SiNextdotjs, SiPrisma, SiPostgresql } from 'react-icons/si';

export default function Certificates() {
  const { currentData } = useSettings();
  const { certificatesPage, certificates } = currentData;

  const getCertificateIcon = (name) => {
    const n = name.toLowerCase();
    const iconSize = 48;

    // MAPEAMENTO ATUALIZADO
    if (n.includes('bootcamp') || n.includes('fullstack')) return <Award size={iconSize} color="var(--accent)" />;
    if (n.includes('ead') || n.includes('netflix')) return <FaReact size={iconSize} color="#61DAFB" />;
    if (n.includes('prisma')) return <SiPrisma size={iconSize} color="#2D3748" />;
    if (n.includes('banco de dados') || (n.includes('sql') && !n.includes('node'))) return <SiPostgresql size={iconSize} color="#336791" />;
    if (n.includes('javascript')) return <SiJavascript size={iconSize} color="#F7DF1E" />;
    if (n.includes('typescript')) return <SiTypescript size={iconSize} color="#3178C6" />;
    if (n.includes('next')) return <SiNextdotjs size={iconSize} />;
    if (n.includes('react')) return <FaReact size={iconSize} color="#61DAFB" />;
    if (n.includes('node')) return <FaNodeJs size={iconSize} color="#339933" />;
    if (n.includes('github')) return <FaGithub size={iconSize} />;
    if (n.includes('git')) return <FaGitAlt size={iconSize} color="#F05032" />;
    if (n.includes('html')) return <FaHtml5 size={iconSize} color="#E34F26" />;
    if (n.includes('css')) return <FaCss3Alt size={iconSize} color="#1572B6" />;
    if (n.includes('bootstrap')) return <FaBootstrap size={iconSize} color="#7952B3" />;
    if (n.includes('sass')) return <FaSass size={iconSize} color="#CC6699" />;

    return <Award size={iconSize} />;
  };

  const gridRef = useRef(null);

  // 証: cada cartão entra e recebe um carimbo hanko com impacto (CustomEase 'hanko')
  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = gsap.utils.toArray('.cert-card', gridRef.current);
    if (reduced) {
      gsap.set(cards.map((c) => c.querySelector('.cert-hanko')), { autoAlpha: 1, scale: 1, rotate: -8 });
      return;
    }
    gsap.set(cards, { autoAlpha: 0, y: 24 });
    ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        const stamps = batch.map((c) => c.querySelector('.cert-hanko'));
        gsap
          .timeline()
          .to(batch, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 })
          .fromTo(
            stamps,
            { autoAlpha: 0, scale: 1.6, rotate: -22 },
            { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.45, ease: 'hanko', stagger: 0.06 },
            0.25,
          )
          // Tremor curto do cartão no impacto
          .fromTo(batch, { x: 0 }, { keyframes: { x: [-2, 2, -1, 0] }, duration: 0.25, stagger: 0.06 }, 0.42);
      },
    });
  }, { scope: gridRef, dependencies: [certificates] });

  return (
    <div className="container" style={{ padding: '80px 24px' }}>
      <div>

        <h1 className="responsive-title section-title">
          <span className="section-kanji font-jp" aria-hidden="true">証</span>
          {certificatesPage.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '50px', fontSize: '1.2rem' }}>
          {certificatesPage.subtitle}
        </p>

        <div ref={gridRef} className="certificates-grid">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="cert-card"
              style={{
                background: 'var(--card-bg)',
                padding: '25px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                height: '100%',
                position: 'relative'
              }}
            >
              <span className="cert-hanko font-jp" aria-hidden="true">証</span>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '60px', height: '60px' }}>
                  {getCertificateIcon(cert.name)}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 5px 0', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {cert.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {cert.institution}
                  </p>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                    <CheckCircle size={14} /> {cert.status}
                  </div>
                </div>
              </div>

              {cert.link && (
                <a
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-fill subtle"
                  style={{
                    marginTop: 'auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', borderRadius: '8px', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {certificatesPage.btnView} <ExternalLink size={16} />
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}