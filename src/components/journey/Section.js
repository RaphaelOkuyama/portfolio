'use client';
import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../../lib/gsap';
import { journeyStore } from '../../store/journey';

// Seção da jornada: informa à store quando está ativa (topo passou do centro da tela)
export default function Section({ id, as: Tag = 'section', ref: externalRef, children, ...rest }) {
  const localRef = useRef(null);

  const setRefs = (node) => {
    localRef.current = node;
    if (typeof externalRef === 'function') externalRef(node);
    else if (externalRef) externalRef.current = node;
  };

  useGSAP(() => {
    const report = (self) => {
      if (self.isActive) journeyStore.getState().setSection(id, self.progress);
    };
    ScrollTrigger.create({
      trigger: localRef.current,
      start: 'top center',
      end: 'bottom center',
      onToggle: report,
      onUpdate: report,
    });
  }, { dependencies: [id] });

  return (
    <Tag id={id} ref={setRefs} {...rest}>
      {children}
    </Tag>
  );
}
