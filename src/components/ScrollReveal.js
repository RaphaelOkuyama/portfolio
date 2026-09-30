'use client';
import Reveal from './Reveal';

export default function ScrollReveal({ children, delay = 0 }) {
  return (
    <Reveal trigger="scroll" from={{ opacity: 0, y: 50 }} duration={0.8} delay={delay}>
      {children}
    </Reveal>
  );
}
