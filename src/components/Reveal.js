'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';

/**
 * Anima a entrada de um elemento (ou dos filhos diretos, com `stagger`).
 * - trigger="scroll": dispara quando entra na tela (uma vez)
 * - trigger="mount": dispara ao montar
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  from = { opacity: 0, y: 20 },
  delay = 0,
  duration = 0.6,
  ease = 'power2.out',
  stagger,
  trigger = 'mount',
  ...rest
}) {
  const ref = useRef(null);

  useGSAP(() => {
    const targets = stagger ? ref.current.children : ref.current;
    gsap.from(targets, {
      ...from,
      delay,
      duration,
      ease,
      stagger,
      clearProps: 'transform,opacity',
      scrollTrigger: trigger === 'scroll' ? { trigger: ref.current, start: 'top bottom-=100px', once: true } : undefined,
    });
  }, { scope: ref });

  return <Tag ref={ref} {...rest}>{children}</Tag>;
}
