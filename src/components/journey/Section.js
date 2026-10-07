'use client';
import { useRef } from 'react';
import { useGSAP } from '../../lib/gsapCore';
import { journeyStore } from '../../store/journey';

// Seção da jornada: informa à store quando está ativa (topo passou do centro da tela)
export default function Section({ id, as: Tag = 'section', ref: externalRef, children, ...rest }) {
  const localRef = useRef(null);

  const setRefs = (node) => {
    localRef.current = node;
    if (typeof externalRef === 'function') externalRef(node);
    else if (externalRef) externalRef.current = node;
  };

  // O ScrollTrigger vem sob demanda: a hero também é uma Section, e o plugin não entra no
  // JavaScript do carregamento (ver lib/gsapCore)
  useGSAP((context) => {
    let cancelled = false;
    import('../../lib/gsap').then(({ ScrollTrigger }) => {
      if (cancelled) return;
      context.add(() => track(ScrollTrigger));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, { dependencies: [id] });

  function track(ScrollTrigger) {
    const report = (self) => {
      if (self.isActive) journeyStore.getState().setSection(id, self.progress);
    };
    // Faixa da seção em fração do progresso: a cena posiciona objetos (senbon, jardim) por ela
    const reportRange = (self) => {
      const max = ScrollTrigger.maxScroll(window);
      if (max > 0) journeyStore.getState().setSectionRange(id, self.start / max, self.end / max);
    };
    const trigger = ScrollTrigger.create({
      trigger: localRef.current,
      start: 'top center',
      end: 'bottom center',
      onToggle: report,
      onUpdate: report,
      onRefresh: reportRange,
    });
    reportRange(trigger);
  }

  return (
    <Tag id={id} ref={setRefs} {...rest}>
      {children}
    </Tag>
  );
}
