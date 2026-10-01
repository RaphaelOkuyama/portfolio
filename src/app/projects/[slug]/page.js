'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Github, Globe, ExternalLink } from 'lucide-react';
import { gsap, SplitText, useGSAP } from '../../../lib/gsap';
import { useSettings } from '../../../context/SettingsContext';
import { kanjiNumber } from '../../../lib/kanji';
import ProjectImageCarousel from '../../../components/ProjectImageCarousel';

// 作 Detalhe do projeto: cabeçalho de emakimono (rolos de madeira + numeral em kanji),
// galeria só quando há imagens, funcionalidades com gotas de tinta e navegação entre projetos
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
  const next = index >= 0 && index < projects.length - 1 ? projects[index + 1] : null;

  useGSAP(() => {
    if (!project || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const split = SplitText.create('.project-title', { type: 'words,chars', mask: 'words' });
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.project-scroll', { clipPath: 'inset(0 50% 0 50%)', duration: 0.9, ease: 'power2.inOut' })
      .from('.project-rod', { scaleY: 0, duration: 0.5, stagger: 0.08 }, 0.1)
      .from('.project-kanji', { autoAlpha: 0, scale: 1.3, duration: 0.7 }, 0.35)
      .from(split.chars, { yPercent: 110, duration: 0.6, stagger: 0.012 }, 0.45)
      .from('.project-reveal', { autoAlpha: 0, y: 24, duration: 0.6, stagger: 0.08 }, 0.7);
    return () => split.revert();
  }, { scope: rootRef, dependencies: [slug, Boolean(project)], revertOnUpdate: true });

  if (!project) {
    return (
      <div className="project-loading">
        <p>{labels.loadingText || 'Carregando...'}</p>
      </div>
    );
  }

  const position = `${String(index + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
  const paragraphs = project.longDesc.split('\n').filter(Boolean);

  return (
    <div ref={rootRef} className="container project-page">
      <button type="button" className="project-back hover-back" onClick={() => router.back()}>
        <ArrowLeft size={18} aria-hidden="true" /> {labels.btnBack || 'Voltar'}
      </button>

      {/* Cabeçalho: o rolo se abre do centro, entre dois rolos de madeira */}
      <header className="project-scroll">
        <span className="project-rod" aria-hidden="true" />
        <div className="project-scroll-body">
          <span className="project-kanji font-jp" aria-hidden="true">{kanjiNumber(index)}</span>
          <p className="project-eyebrow">
            <span className="font-jp" aria-hidden="true">作</span> {labels.projectLabel} {position}
          </p>
          <h1 className="project-title">{project.title}</h1>
          <p className="project-lead project-reveal">{project.shortDesc}</p>
          <ul className="project-stack project-reveal" aria-label={labels.techs}>
            {project.stack.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          {(project.deployLink || project.repoLink) && (
            <div className="project-links project-reveal">
              {project.deployLink && (
                <a href={project.deployLink} target="_blank" rel="noopener noreferrer" className="project-link is-primary">
                  <Globe size={18} aria-hidden="true" /> {labels.btnDeploy} <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
              {project.repoLink && (
                <a href={project.repoLink} target="_blank" rel="noopener noreferrer" className="project-link">
                  <Github size={18} aria-hidden="true" /> {labels.btnCode}
                </a>
              )}
            </div>
          )}
        </div>
        <span className="project-rod" aria-hidden="true" />
      </header>

      {project.images?.length > 0 && (
        <section className="project-gallery project-reveal" aria-label={labels.gallery}>
          <ProjectImageCarousel images={project.images} isMobile={project.imageMobile} />
        </section>
      )}

      <div className="project-body">
        <section className="project-about project-reveal">
          <h2>{labels.aboutProject}</h2>
          {paragraphs.map((text) => (
            <p key={text.slice(0, 32)}>{text}</p>
          ))}
        </section>

        {project.features?.length > 0 && (
          <section className="project-features project-reveal">
            <h2>{labels.features}</h2>
            <ul>
              {project.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Navegação no rolo: anterior / próximo */}
      <nav className="project-nav" aria-label={labels.projectLabel}>
        {prev ? (
          <Link href={`/projects/${prev.slug}`} className="project-nav-link">
            <span className="project-nav-label"><ArrowLeft size={16} aria-hidden="true" /> {labels.prevProject}</span>
            <span className="project-nav-title">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/projects/${next.slug}`} className="project-nav-link is-next">
            <span className="project-nav-label">{labels.nextProject} <ArrowRight size={16} aria-hidden="true" /></span>
            <span className="project-nav-title">{next.title}</span>
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
