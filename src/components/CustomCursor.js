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
  const [isVisible, setIsVisible] = useState(false); // Começa invisível

  useEffect(() => {
    // Função para checar se é desktop (tem mouse preciso)
    const checkDevice = () => {
      // Verifica se o dispositivo tem pointer fino (mouse) E se a tela é larga
      const isDesktop = window.matchMedia('(pointer: fine) and (min-width: 768px)').matches;
      setIsVisible(isDesktop);
    };

    // Checa ao carregar e ao redimensionar
    checkDevice();
    window.addEventListener('resize', checkDevice);

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

    // Só adiciona os eventos se for desktop
    if (isVisible) {
      window.addEventListener('mousemove', moveCursor);
      window.addEventListener('mouseover', checkHover);
    }

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', checkHover);
    };
  }, [cursorX, cursorY, isVisible]);

  // Se não for desktop, não renderiza nada (o cursor nativo do sistema ou toque será usado)
  if (!isVisible) return null;

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