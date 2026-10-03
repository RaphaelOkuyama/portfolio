'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { gsap, ScrollTrigger, Draggable, useGSAP } from '../../lib/gsap';
import Section from '../journey/Section';
import { kanjiNumber } from '../../lib/kanji';
import KeepHyphenated from '../KeepHyphenated';
import { startMorph } from '../../lib/panelMorph';
import { homeProjects } from '../../lib/projects';
import Ruby from '../Ruby';
import Tate from '../Tate';


// Modos do rolo: pin horizontal no desktop, arrastar no celular, grade estática com movimento reduzido
const DESKTOP = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';
const MOBILE = '(max-width: 767px) and (prefers-reduced-motion: no-preference)';

function isPlainClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

// 作 Projetos: emakimono (絵巻物) — o scroll vertical desenrola o rolo na horizontal
export default function EmakiProjects({ projects, labels }) {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const scrollTweenRef = useRef(null);
  const rollerRef = useRef(null);
  const router = useRouter();
  const projectsKey = projects.map((p) => p.slug).join('|');

  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Desenrolar (0 = enrolado junto ao rolo de madeira, 1 = aberto): o papel aparece por um
    // recorte que acompanha o cilindro de papel enrolado, puxado da esquerda para a direita
    const setUnroll = (p) => {
      const viewport = viewportRef.current;
      const roller = rollerRef.current;
      const rod = trackRef.current?.querySelector('.emaki-rod');
      if (!viewport || !roller || !rod) return;
      const box = viewport.getBoundingClientRect();
      const width = viewport.clientWidth;
      const start = rod.getBoundingClientRect().right - box.left + 2;
      const end = width - roller.offsetWidth;
      const edge = start + (end - start) * p;
      // Inset negativo em cima/embaixo: as pontas dos rolos passam um pouco do papel
      viewport.style.clipPath = p >= 1 ? '' : `inset(-24px ${Math.max(0, width - edge)}px -24px 0)`;
      gsap.set(roller, { x: edge });
    };
    const resetUnroll = () => {
      if (viewportRef.current) viewportRef.current.style.clipPath = '';
    };

    mm.add(DESKTOP, () => {
      const track = trackRef.current;
      const distance = () => Math.max(0, track.scrollWidth - viewportRef.current.clientWidth);

      // O rolo se abre enquanto a seção sobe na tela e termina aberto quando ela fixa
      const unroll = { p: 0 };
      setUnroll(0);
      gsap.to(unroll, {
        p: 1,
        ease: 'none',
        onUpdate: () => setUnroll(unroll.p),
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top 85%',
          end: 'top 72px',
          scrub: 0.6,
          onRefresh: () => setUnroll(unroll.p),
        },
      });

      const scrollTween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinRef.current,
          // Fixa abaixo da navbar para o título não ficar escondido atrás dela
          start: 'top 72px',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          // Calcula o pin antes dos gatilhos criados antes dele (ex.: a própria Section)
          refreshPriority: 1,
          // O cilindro segura o resto do rolo na borda direita e some quando o fim chega
          onUpdate: (self) => {
            if (rollerRef.current) rollerRef.current.style.opacity = String(1 - gsap.utils.clamp(0, 1, (self.progress - 0.9) / 0.1));
          },
        },
      });
      scrollTweenRef.current = scrollTween;

      // O conteúdo de cada painel surge ao entrar pela direita (tinta assentando no papel).
      // Sem clip-path: o painel nunca aparece cortado, e o último termina aberto no fim do rolo
      gsap.utils.toArray('.emaki-panel', track).forEach((panel) => {
        gsap.from(panel.children, {
          opacity: 0,
          x: 36,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: scrollTween,
            start: 'left 100%',
            end: 'left 72%',
            scrub: true,
          },
        });
      });

      return () => {
        scrollTweenRef.current = null;
        if (rollerRef.current) rollerRef.current.style.opacity = '';
        resetUnroll();
      };
    });

    mm.add(MOBILE, () => {
      const track = trackRef.current;

      // Sem pin no celular: o rolo se abre sozinho quando aparece e o cilindro sai de cena
      const unroll = { p: 0 };
      setUnroll(0);
      const opening = gsap.to(unroll, {
        p: 1,
        duration: 1.4,
        ease: 'power2.inOut',
        paused: true,
        onUpdate: () => setUnroll(unroll.p),
        onComplete: () => gsap.to(rollerRef.current, { autoAlpha: 0, duration: 0.4 }),
      });
      ScrollTrigger.create({ trigger: viewportRef.current, start: 'top 80%', once: true, onEnter: () => opening.play() });

      const [draggable] = Draggable.create(track, {
        type: 'x',
        inertia: true,
        bounds: viewportRef.current,
        edgeResistance: 0.85,
        dragClickables: true,
        allowNativeTouchScrolling: true,
      });
      return () => {
        draggable.kill();
        resetUnroll();
      };
    });

    return () => mm.revert();
  // Depende só de QUAIS projetos aparecem, não dos textos: trocar o idioma entrega uma lista nova
  // com os mesmos projetos, e refazer o pin derrubava a rolagem e congelava o texto dos painéis
  }, { scope: rootRef, dependencies: [projectsKey], revertOnUpdate: true });

  // Teclado: ao focar um painel fora da tela, rola até ele
  const revealPanel = (panel) => {
    const tween = scrollTweenRef.current;
    const st = tween?.scrollTrigger;
    if (!st) return;
    const viewport = viewportRef.current;
    // O foco nativo tenta rolar o contêiner com overflow; quem move o rolo é o scroll da página
    viewport.scrollLeft = 0;
    const distance = trackRef.current.scrollWidth - viewport.clientWidth;
    if (distance <= 0) return;
    // Posição do painel dentro do rolo, sem depender de offsetParent nem do transform atual
    const offset = panel.getBoundingClientRect().left - trackRef.current.getBoundingClientRect().left;
    const center = offset + panel.offsetWidth / 2 - viewport.clientWidth / 2;
    const ratio = Math.min(1, Math.max(0, center / distance));
    window.scrollTo(0, st.start + ratio * (st.end - st.start));
    ScrollTrigger.update();
  };

  // O painel cresce até cobrir a tela e vira o topo da página do projeto (lib/panelMorph)
  const onPanelClick = (e, slug) => {
    if (!isPlainClick(e)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    startMorph({ panel: e.currentTarget, slug, onCovered: () => router.push(`/projects/${slug}`) });
  };

  return (
    <Section id="projects" ref={rootRef} className="emaki-section">
      <div ref={pinRef} className="emaki-pin">
        <header className="emaki-header">
          <h2 className="section-title">
            <span className="section-kanji font-jp" aria-hidden="true"><Ruby>作</Ruby></span>
            <span className="section-title-text">{labels.title}<Tate>作品</Tate></span>
          </h2>
          {/* No celular o rolo é arrastado, não rolado */}
          <p className="zen-hint">
            <span className="emaki-hint-scroll">{labels.hint}</span>
            <span className="emaki-hint-drag">{labels.hintDrag}</span>
          </p>
        </header>

        <div className="emaki-stage">
          <div ref={viewportRef} className="emaki-viewport">
            <ol ref={trackRef} className="emaki-track" aria-label={labels.title}>
              <li className="emaki-rod" aria-hidden="true" />
              {homeProjects(projects).map(({ project, index: i }) => {
                const href = `/projects/${project.slug}`;
                return (
                  <li key={project.id} className="emaki-item">
                    <Link
                      href={href}
                      className="emaki-panel"
                      data-project={project.slug}
                      data-no-transition=""
                      onClick={(e) => onPanelClick(e, project.slug)}
                      onFocus={(e) => revealPanel(e.currentTarget)}
                    >
                      <span className="emaki-number font-jp" aria-hidden="true">{kanjiNumber(i)}</span>
                      <h3 className="emaki-title"><KeepHyphenated>{project.title}</KeepHyphenated></h3>
                      <p className="emaki-desc">{project.shortDesc}</p>
                      <ul className="emaki-stack">
                        {project.stack.slice(0, 4).map((tech) => (
                          <li key={tech}>{tech}</li>
                        ))}
                      </ul>
                      <span className="emaki-cta">
                        {labels.btnDetails} <ArrowRight size={18} aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
              {/* Fim do rolo: o convite para a página com todos os projetos */}
              <li className="emaki-item">
                <Link href="/projects" className="emaki-panel is-all" onFocus={(e) => revealPanel(e.currentTarget)}>
                  <span className="emaki-number font-jp" aria-hidden="true">全</span>
                  <h3 className="emaki-title">{labels.allTitle.replace('{n}', projects.length)}</h3>
                  <p className="emaki-desc">{labels.allDesc}</p>
                  <span className="emaki-cta">
                    {labels.btnAll} <ArrowRight size={18} aria-hidden="true" />
                  </span>
                </Link>
              </li>
              <li className="emaki-rod" aria-hidden="true" />
            </ol>
          </div>
          {/* Papel ainda enrolado no jiku (軸): puxa o rolo ao abrir e segura o resto */}
          <div ref={rollerRef} className="emaki-roller" aria-hidden="true" />
        </div>

      </div>
    </Section>
  );
}
