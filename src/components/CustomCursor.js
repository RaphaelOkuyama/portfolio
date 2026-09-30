'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Checar se é desktop em useEffect separado (sem dependência de isDesktop)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (min-width: 768px)');
    setIsDesktop(mq.matches);

    const handleMqChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handleMqChange);
    return () => mq.removeEventListener('change', handleMqChange);
  }, []);

  // Eventos de mouse — só rodam quando isDesktop muda
  useEffect(() => {
    if (!isDesktop) return;

    gsap.set([dotRef.current, ringRef.current], { xPercent: -50, yPercent: -50, x: -100, y: -100 });

    // Ponto segue direto; anel segue com atraso (efeito mola)
    const dotX = gsap.quickSetter(dotRef.current, 'x', 'px');
    const dotY = gsap.quickSetter(dotRef.current, 'y', 'px');
    const ringX = gsap.quickTo(ringRef.current, 'x', { duration: 0.35, ease: 'power3.out' });
    const ringY = gsap.quickTo(ringRef.current, 'y', { duration: 0.35, ease: 'power3.out' });

    const moveCursor = (e) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const checkHover = (e) => {
      const target = e.target;
      const isClickable =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.type === 'submit' ||
        target.type === 'email' ||
        target.type === 'text';

      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', checkHover);

    // Cleanup correto: remove exatamente os mesmos listeners que foram adicionados
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', checkHover);
    };
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    gsap.to(ringRef.current, {
      scale: isHovering ? 1.8 : 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  }, [isHovering, isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '8px', height: '8px',
          backgroundColor: 'var(--accent)',
          borderRadius: '50%',
          pointerEvents: 'none', zIndex: 9999,
        }}
      />

      <div
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '30px', height: '30px',
          border: `${isHovering ? 2 : 1}px solid ${isHovering ? 'var(--accent)' : 'var(--text-secondary)'}`,
          borderRadius: '50%',
          pointerEvents: 'none', zIndex: 9998,
          transition: 'border-color 0.3s, border-width 0.3s',
        }}
      />
    </>
  );
}
