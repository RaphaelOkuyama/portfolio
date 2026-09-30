'use client';
import { useState, useEffect, useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); 
          return 100;
        }
        return Math.min(old + Math.floor(Math.random() * 8) + 2, 100); // Um pouco mais rápido
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onComplete]);

  const dotsRef = useRef(null);

  // Pontinhos pulando um de cada vez (onda)
  useGSAP(() => {
    gsap.to(dotsRef.current.children, {
      keyframes: { y: [0, -15, 0], easeEach: 'sine.inOut' },
      duration: 0.6,
      stagger: { each: 0.2, repeat: -1 },
    });
  }, { scope: dotsRef });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-color)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Pontinhos Pulando (Sincronia ajustada) */}
      <div ref={dotsRef} style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ width: '15px', height: '15px', background: 'var(--accent)', borderRadius: '50%' }}
          />
        ))}
      </div>

      {/* Porcentagem */}
      <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
        {progress}%
      </div>

      {/* Barra de Progresso */}
      <div style={{ width: '250px', height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'var(--accent)', width: `${progress}%` }} />
      </div>
    </div>
  );
}