'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 }; 
  
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

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

    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
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
  }, [isDesktop, cursorX, cursorY]);

  if (!isDesktop) return null;

  return (
    <>
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          position: 'fixed', top: 0, left: 0,
          width: '8px', height: '8px',
          backgroundColor: 'var(--accent)',
          borderRadius: '50%',
          pointerEvents: 'none', zIndex: 9999,
          translateX: '-50%', translateY: '-50%',
        }}
      />
      
      <motion.div
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          position: 'fixed', top: 0, left: 0,
          width: '30px', height: '30px',
          border: '1px solid var(--text-secondary)',
          borderRadius: '50%',
          pointerEvents: 'none', zIndex: 9998,
          translateX: '-50%', translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.8 : 1, 
          borderColor: isHovering ? 'var(--accent)' : 'var(--text-secondary)',
          borderWidth: isHovering ? '2px' : '1px'
        }}
      />
    </>
  );
}