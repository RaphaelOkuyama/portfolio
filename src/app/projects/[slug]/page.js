'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowDown, Github, Globe } from 'lucide-react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../../lib/gsap';
import { useSettings } from '../../../context/SettingsContext';
import { kanjiNumber } from '../../../lib/kanji';
import ProjectImageCarousel from '../../../components/ProjectImageCarousel';
import KeepHyphenated from '../../../components/KeepHyphenated';

const pad = (n) => String(n).padStart(2, '0');

// Botões magnéticos: puxados alguns pixels na direção do cursor, voltam com mola ao sair
function magnetize(scope) {
  if (!window.matchMedia('(pointer: fine)').matches) return () => {};
  const cleanups = gsap.utils.toArray('.magnetic', scope).map((el) => {
    const toX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const toY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      toX((e.clientX - (r.left + r.width / 2)) * 0.3);
      toY((e.clientY - (r.top + r.height / 2)) * 0.4);
    };
    const leave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  });
  return () => cleanups.forEach((fn) => fn());
}

// 作 Estudo de caso do projeto: hero editorial sobre a cena, faixa de stack em marquee,
// seções numeradas e o próximo projeto em destaque no fim do rolo
export default function ProjectDetails() {
  const { slug } = useParams();
  const router = useRouter();
  const { currentData } = useSettings();
  const rootRef = useRef(null);

  const projects = currentData?.projects ?? [];
  const labels = currentData?.projectsPage ?? {};
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];
  const prev = index > 0 ? projects[index - 1] : null;
  // O último projeto fecha o ciclo voltando ao primeiro
  const next = index >= 0 ? projects[(index + 1) % projects.length] : null;

  useGSAP(() => {
    if (!project) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanups = [magnetize(rootRef.current)];

    // Linha de leitura: tinta descendo pela lateral conforme o scroll
    gsap.fromTo('.case-progress span', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    });

    // Stack em marquee: anda sozinha e acelera com a velocidade do scroll
    const track = rootRef.current.querySelector('.case-marquee-track');
    if (track && !reduced) {
      const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
      const boost = gsap.quickTo(loop, 'timeScale', { duration: 0.6, ease: 'power2.out' });
      ScrollTrigger.create({
        trigger: '.case-marquee',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity() / 300;
          boost(gsap.utils.clamp(-4, 4, v === 0 ? 1 : 1 + Math.abs(v)) * (v < 0 ? -1 : 1));
        },
      });
      cleanups.push(() => loop.kill());
    }

    if (reduced) return () => cleanups.forEach((fn) => fn());

    // Entrada do hero: numeral, título letra a letra saindo da máscara, depois o resto
    // Máscara por palavra com folga (CSS .case-word-mask): sem ela, as pernas (g, p, y) e os
    // acentos eram cortados rente à caixa da letra
    const split = SplitText.create('.case-title', { type: 'words,chars', mask: 'words', wordsClass: 'case-word' });
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.case-kanji', { opacity: 0, scale: 1.15, duration: 1.4, ease: 'power2.out' }, 0)
      .from('.case-eyebrow, .case-back', { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 }, 0.1)
      .from(split.chars, { yPercent: 140, duration: 1, stagger: 0.018 }, 0.2)
      .from('.case-lead', { opacity: 0, y: 24, duration: 0.8 }, 0.6)
      .from('.case-links > *', { opacity: 0, y: 18, duration: 0.6, stagger: 0.08 }, 0.7)
      .from('.case-meta > div', { opacity: 0, y: 20, duration: 0.6, stagger: 0.07 }, 0.8)
      .from('.case-meta', { '--rule': 0, duration: 1.2, ease: 'power2.inOut' }, 0.7);

    // Numeral em parallax: desce mais devagar que a página
    gsap.to('.case-kanji', {
      yPercent: 35, ease: 'none',
      scrollTrigger: { trigger: '.case-hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // Cada seção: título e linha entram ao aparecer
    gsap.utils.toArray('.case-section').forEach((section) => {
      gsap.from(section.querySelectorAll('.case-section-head > *, .case-reveal'), {
        opacity: 0, y: 36, duration: 0.9, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 78%' },
      });
    });
    gsap.from('.case-feature', {
      opacity: 0, y: 28, duration: 0.7, stagger: 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: '.case-features', start: 'top 80%' },
    });

    // Sem SplitText aqui: o preenchimento usa background-clip: text, que não atravessa os
    // pedaços transformados; o título sobe inteiro, recortado de baixo para cima
    // Termina com folga negativa e tira o recorte: inset(0) cortaria as pernas das letras
    gsap.fromTo('.case-next-title', { clipPath: 'inset(100% -5% -30% -5%)', y: 60 }, {
      clipPath: 'inset(-30% -5% -30% -5%)', y: 0, duration: 1.1, ease: 'power4.out', clearProps: 'clipPath',
      scrollTrigger: { trigger: '.case-next', start: 'top 85%' },
    });

    return () => {
      split.revert();
      cleanups.forEach((fn) => fn());
    };
  }, { scope: rootRef, dependencies: [slug, Boolean(project)], revertOnUpdate: true });

  if (!project) {
    return (
      <div className="project-loading">
        <p>{labels.loadingText || 'Carregando...'}</p>
      </div>
    );
  }

  const position = `${pad(index + 1)} / ${pad(projects.length)}`;
  const [lead, ...paragraphs] = project.longDesc.split('\n').filter(Boolean);
  const hasGallery = project.images?.length > 0;
  const status = project.deployLink ? labels.statusLive : labels.statusCode;
  // Duas cópias da stack para o marquee dar a volta sem emenda
  const marquee = [...project.stack, ...project.stack];

  return (
    <article ref={rootRef} className="case">
      <div className="case-progress" aria-hidden="true"><span /></div>

      <header className="case-hero">
        <span className="case-kanji font-jp" aria-hidden="true">{kanjiNumber(index)}</span>
        <div className="case-wrap case-hero-inner">
          <div className="case-topline">
            <button type="button" className="case-back hover-back" onClick={() => router.back()}>
              <ArrowLeft size={18} aria-hidden="true" /> {labels.btnBack || 'Voltar'}
            </button>
            <p className="case-eyebrow project-eyebrow">
              <span className="font-jp" aria-hidden="true">作</span> {labels.projectLabel} {position}
            </p>
          </div>

          <h1 className="case-title"><KeepHyphenated>{project.title}</KeepHyphenated></h1>
          <p className="case-lead">{project.shortDesc}</p>

          {(project.deployLink || project.repoLink) && (
            <div className="case-links">
              {project.deployLink && (
                <a href={project.deployLink} target="_blank" rel="noopener noreferrer" className="case-link is-primary magnetic">
                  <Globe size={18} aria-hidden="true" /> {labels.btnDeploy}
                </a>
              )}
              {project.repoLink && (
                <a href={project.repoLink} target="_blank" rel="noopener noreferrer" className="case-link magnetic">
                  <Github size={18} aria-hidden="true" /> {labels.btnCode}
                </a>
              )}
            </div>
          )}

          <dl className="case-meta">
            <div>
              <dt>{labels.status}</dt>
              <dd>{status}</dd>
            </div>
            <div>
              <dt>{labels.techCount}</dt>
              <dd>{pad(project.stack.length)}</dd>
            </div>
            <div>
              <dt>{labels.featureCount}</dt>
              <dd>{pad(project.features?.length ?? 0)}</dd>
            </div>
            <div className="case-cue">
              <dt className="sr-only">{labels.scrollCue}</dt>
              <dd aria-hidden="true">{labels.scrollCue} <ArrowDown size={16} /></dd>
            </div>
          </dl>
        </div>
      </header>

      {/* Stack: lista acessível + faixa em movimento só visual */}
      <section className="case-marquee" aria-label={labels.techs}>
        <ul className="sr-only">
          {project.stack.map((tech) => <li key={tech}>{tech}</li>)}
        </ul>
        <div className="case-marquee-track" aria-hidden="true">
          {marquee.map((tech, i) => (
            <span key={`${tech}-${i}`} className={i % 2 ? 'is-outline' : undefined}>
              {tech}<i className="font-jp">・</i>
            </span>
          ))}
        </div>
      </section>

      <div className="case-paper">
        <section className="case-section case-wrap">
          <div className="case-section-head">
            <span className="case-num">01</span>
            <h2>{labels.overview}</h2>
          </div>
          <div className="case-section-body">
            <p className="case-reveal case-intro">{lead}</p>
            {paragraphs.map((text) => (
              <p key={text.slice(0, 32)} className="case-reveal">{text}</p>
            ))}
          </div>
        </section>

        {project.features?.length > 0 && (
          <section className="case-section case-wrap">
            <div className="case-section-head">
              <span className="case-num">02</span>
              <h2>{labels.features}</h2>
            </div>
            <ol className="case-features case-section-body">
              {project.features.map((feature, i) => (
                <li key={feature} className="case-feature">
                  <span className="case-feature-num font-jp" aria-hidden="true">{kanjiNumber(i)}</span>
                  <span className="case-feature-text">{feature}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {hasGallery && (
          <section className="case-section case-wrap project-gallery" aria-label={labels.gallery}>
            <div className="case-section-head">
              <span className="case-num">03</span>
              <h2>{labels.gallery}</h2>
            </div>
            <div className="case-section-body case-reveal">
              <ProjectImageCarousel images={project.images} isMobile={project.imageMobile} />
            </div>
          </section>
        )}

        {/* Fim do rolo: o próximo projeto em destaque; o anterior discreto ao lado */}
        <nav className="case-nav case-wrap" aria-label={labels.projectLabel}>
          {next && (
            <Link href={`/projects/${next.slug}`} className="case-next">
              <span className="case-next-label">
                {labels.nextProject} <ArrowRight size={18} aria-hidden="true" />
              </span>
              <span className="case-next-title"><KeepHyphenated>{next.title}</KeepHyphenated></span>
              <span className="case-next-kanji font-jp" aria-hidden="true">{kanjiNumber((index + 1) % projects.length)}</span>
            </Link>
          )}
          {prev && (
            <Link href={`/projects/${prev.slug}`} className="case-prev hover-back">
              <ArrowLeft size={16} aria-hidden="true" /> {labels.prevProject}: {prev.title}
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
