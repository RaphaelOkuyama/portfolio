'use client';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap';
import Section from '../journey/Section';
import Ruby from '../Ruby';
import StationSign from '../journey/StationSign';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// 人 Sobre: a história por trás do nome (奥山 · 芳賀), a foto que desenrola como kakejiku
// e as duas saídas (currículo e contato)
export default function AboutSection({ about }) {
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const scrollRef = useRef(null);
  const stampRef = useRef(null);

  // Linhas do texto entram conforme a seção rola (máscara por linha)
  useGSAP(() => {
    if (prefersReducedMotion()) return undefined;
    const split = SplitText.create(textRef.current.querySelectorAll('p'), {
      type: 'lines',
      mask: 'lines',
      linesClass: 'about-line',
      autoSplit: true,
      // Sem aria-label no <p> (proibido em parágrafo): as linhas mantêm o texto legível
      aria: 'none',
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.05,
          ease: 'none',
          // Termina assim que o fim do texto entra na tela: ninguém precisa rolar até o meio para ler
          scrollTrigger: { trigger: textRef.current, start: 'top 95%', end: 'bottom 85%', scrub: 0.4 },
        }),
    });
    return () => split.revert();
  }, { scope: rootRef, dependencies: [about.lead], revertOnUpdate: true });

  // Kakejiku: o rolo desce e revela a foto de cima para baixo
  useGSAP(() => {
    const scroll = scrollRef.current;
    const photo = scroll.querySelector('.kakejiku-photo');
    const rod = scroll.querySelector('.kakejiku-rod-bottom');
    if (prefersReducedMotion()) return;
    gsap
      .timeline({ scrollTrigger: { trigger: scroll, start: 'top 80%', once: true } })
      .fromTo(photo, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power2.inOut' }, 0)
      .fromTo(rod, { y: () => -photo.offsetHeight }, { y: 0, duration: 1.2, ease: 'power2.inOut' }, 0)
      .from('.about-name', { opacity: 0, y: 10, duration: 0.6, stagger: 0.12, ease: 'power2.out' }, 0.9);
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
    <Section id="about" ref={rootRef} className="about-section">
      <div className="about-grid">
        <div className="about-copy">
          <StationSign id="about" kanji="人" title={about.title} tate="自己紹介" />
          <p className="about-lead">{about.lead}</p>
          <div ref={textRef} key={about.lead} className="about-text">
            {about.paragraphs.map((text) => (
              <p key={text.slice(0, 24)}>{text}</p>
            ))}
          </div>


          <div className="about-actions">
            <div className="about-resume">
              <a
                href="/curriculo.pdf"
                download="Raphael_Okuyama_CV.pdf"
                className="btn-fill about-btn"
                onClick={stamp}
              >
                <Download size={20} aria-hidden="true" />
                {about.btnResume}
              </a>
              <span ref={stampRef} className="hanko font-jp" data-stamp="" aria-hidden="true">
                奥山
              </span>
            </div>
            <Link href="/#contato" className="about-contact hover-back">
              {about.btnContact} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <figure className="about-portrait">
          <div ref={scrollRef} className="kakejiku" data-kakejiku="">
            <div className="kakejiku-rod" />
            <div className="kakejiku-photo photo-tilt">
              <Image src="/profile.jpg" alt="Raphael Okuyama" fill sizes="(max-width: 768px) 60vw, 320px" />
              <div className="photo-overlay" />
            </div>
            <div className="kakejiku-rod kakejiku-rod-bottom" />
          </div>
          {/* Os dois sobrenomes em escrita vertical, como numa assinatura */}
          <figcaption className="about-names">
            {about.names.map((name) => (
              <span key={name.romaji} className="about-name">
                <span className="about-name-kanji font-jp" lang="ja"><Ruby>{name.kanji}</Ruby></span>
                <span className="about-name-text">
                  <strong>{name.romaji}</strong>
                  <span>{name.note}</span>
                </span>
              </span>
            ))}
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
