'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP } from '../lib/gsap';
import { ArrowLeft, TerminalSquare } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function NotFound() {
  const { language } = useSettings();
  const rootRef = useRef(null);

  useGSAP(() => {
    // Entrada
    gsap.from('.nf-icon', { scale: 0, duration: 0.8, ease: 'back.out(2.5)' });
    gsap.to('.nf-caret', { opacity: 0, duration: 0.4, ease: 'steps(1)', repeat: -1, yoyo: true });
    gsap.from('.nf-fade', { opacity: 0, y: 20, duration: 0.5, stagger: 0.1, delay: 0.2, clearProps: 'transform,opacity' });

    // "404" de fundo segue o mouse em sentido oposto
    const moveX = gsap.quickTo('.nf-bg', 'x', { duration: 1.2, ease: 'power3.out' });
    const moveY = gsap.quickTo('.nf-bg', 'y', { duration: 1.2, ease: 'power3.out' });
    const handleMouseMove = (e) => {
      moveX(((e.clientX / window.innerWidth) * 2 - 1) * -30);
      moveY(((e.clientY / window.innerHeight) * 2 - 1) * -30);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, { scope: rootRef });

  const text = {
    pt: {
      subtitle: "Página não encontrada",
      desc: "Parece que você navegou para fora do mapa. A rota que você tentou acessar não existe ou foi refatorada.",
      btn: "Voltar para a base"
    },
    en: {
      subtitle: "Page Not Found",
      desc: "Looks like you navigated off the map. The route you tried to access doesn't exist or was refactored.",
      btn: "Return to base"
    }
  };

  const t = text[language] || text.pt;

  return (
    <div ref={rootRef} style={{
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      <div
        className="nf-bg"
        style={{
          position: 'absolute',
          fontSize: 'clamp(12rem, 35vw, 30rem)',
          fontWeight: '900',
          color: 'var(--accent)',
          opacity: 0.05,
          zIndex: -1,
          userSelect: 'none',
          lineHeight: 1,
          pointerEvents: 'none'
        }}
      >
        404
      </div>

      <div
        className="nf-icon"
        style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}
      >
        <TerminalSquare size={56} color="var(--accent)" />
        <div
          className="nf-caret"
          style={{ width: '25px', height: '6px', background: 'var(--accent)', marginTop: '20px' }}
        />
      </div>

      <h1
        className="nf-fade"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '15px', color: 'var(--text-primary)' }}
      >
        {t.subtitle}
      </h1>

      <p
        className="nf-fade"
        style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '40px' }}
      >
        {t.desc}
      </p>

      <div className="nf-fade">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button
            className="glow-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 30px', borderRadius: '50px',
              border: '1px solid var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '1rem'
            }}
          >
            <ArrowLeft size={20} /> {t.btn}
          </button>
        </Link>
      </div>
    </div>
  );
}
