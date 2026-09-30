'use client';
import { useRef } from 'react';
import { Download } from 'lucide-react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap';
import Section from '../journey/Section';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// 人 Sobre: cada portão do senbon torii revela uma linha do texto; a foto desenrola como kakejiku
export default function AboutSection({ about }) {
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const scrollRef = useRef(null);
  const stampRef = useRef(null);

  // Linhas do texto entram conforme a seção rola (máscara por linha)
  useGSAP(() => {
    if (prefersReducedMotion()) return undefined;
    const split = SplitText.create(textRef.current, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'about-line',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.12,
          ease: 'none',
          scrollTrigger: { trigger: rootRef.current, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
        }),
    });
    return () => split.revert();
  }, { scope: rootRef, dependencies: [about.desc], revertOnUpdate: true });

  // Kakejiku: o rolo desce e revela a foto de cima para baixo
  useGSAP(() => {
    const scroll = scrollRef.current;
    const photo = scroll.querySelector('.kakejiku-photo');
    const rod = scroll.querySelector('.kakejiku-rod-bottom');
    if (prefersReducedMotion()) return;
    gsap
      .timeline({ scrollTrigger: { trigger: scroll, start: 'top 80%', once: true } })
      .fromTo(photo, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power2.inOut' }, 0)
      .fromTo(rod, { y: () => -photo.offsetHeight }, { y: 0, duration: 1.2, ease: 'power2.inOut' }, 0);
  }, { scope: rootRef });

  // Carimbo 印 ao baixar o currículo (o download segue normalmente)
  const stamp = () => {
    const el = stampRef.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    gsap.killTweensOf(el);
    gsap
      .timeline()
      .set(el, { autoAlpha: 1 })
      .fromTo(
        el,
        { scale: reduced ? 1 : 1.8, rotate: -18 },
        { scale: 1, rotate: -8, duration: reduced ? 0 : 0.35, ease: 'back.out(3)' },
      )
      .to(el, { autoAlpha: 0, duration: reduced ? 0 : 0.5, delay: 1.2 });
  };

  return (
    <Section
      id="about"
      ref={rootRef}
      style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 0 80px 0' }}
    >
      <div className="responsive-grid" style={{ alignItems: 'center', width: '100%' }}>
        {/* Painel translúcido garante contraste do texto sobre os portões e as montanhas */}
        <div className="about-copy">
          <h2 className="section-title">
            <span className="section-kanji font-jp" aria-hidden="true">人</span>
            {about.title}
          </h2>
          <p ref={textRef} key={about.desc} className="about-text">
            {about.desc}
          </p>

          <div style={{ position: 'relative', display: 'inline-block' }}>
            <a
              href="/curriculo.pdf"
              download="Raphael_Okuyama_CV.pdf"
              className="btn-fill"
              onClick={stamp}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '12px 30px', borderRadius: '50px',
                border: '2px solid var(--text-secondary)',
                color: 'var(--text-primary)', textDecoration: 'none',
                fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              <Download size={20} />
              {about.btnResume}
            </a>
            <span ref={stampRef} className="hanko font-jp" data-stamp="" aria-hidden="true">
              奥山
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div ref={scrollRef} className="kakejiku" data-kakejiku="">
            <div className="kakejiku-rod" />
            <div className="kakejiku-photo photo-tilt">
              <img src="/profile.jpg" alt="Raphael Okuyama" />
              <div className="photo-overlay" />
            </div>
            <div className="kakejiku-rod kakejiku-rod-bottom" />
          </div>
        </div>
      </div>
    </Section>
  );
}
