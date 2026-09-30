'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { gsap, ScrollTrigger, Draggable, useGSAP } from '../../lib/gsap';
import Section from '../journey/Section';

const KANJI_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

// Modos do rolo: pin horizontal no desktop, arrastar no celular, grade estática com movimento reduzido
const DESKTOP = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';
const MOBILE = '(max-width: 767px) and (prefers-reduced-motion: no-preference)';

function isPlainClick(e) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

// Painel "abre" até cobrir a tela e só então navega para o detalhe do projeto
function expandAndNavigate(panel, href, router) {
  const rect = panel.getBoundingClientRect();
  const overlay = document.createElement('div');
  overlay.className = 'emaki-expand';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px`,
  });
  document.body.appendChild(overlay);

  gsap.to(overlay, {
    top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0,
    duration: 0.55, ease: 'power3.inOut',
    onComplete: () => {
      router.push(href);
      gsap.to(overlay, { opacity: 0, delay: 0.25, duration: 0.4, onComplete: () => overlay.remove() });
    },
  });
}

// 作 Projetos: emakimono (絵巻物) — o scroll vertical desenrola o rolo na horizontal
export default function EmakiProjects({ projects, labels }) {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const scrollTweenRef = useRef(null);
  const router = useRouter();

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(DESKTOP, () => {
      const track = trackRef.current;
      const distance = () => Math.max(0, track.scrollWidth - viewportRef.current.clientWidth);

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
      };
    });

    mm.add(MOBILE, () => {
      const track = trackRef.current;
      const [draggable] = Draggable.create(track, {
        type: 'x',
        inertia: true,
        bounds: viewportRef.current,
        edgeResistance: 0.85,
        dragClickables: true,
        allowNativeTouchScrolling: true,
      });
      return () => draggable.kill();
    });

    return () => mm.revert();
  }, { scope: rootRef, dependencies: [projects], revertOnUpdate: true });

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

  const onPanelClick = (e, href) => {
    if (!isPlainClick(e)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    expandAndNavigate(e.currentTarget, href, router);
  };

  return (
    <Section id="projects" ref={rootRef} className="emaki-section">
      <div ref={pinRef} className="emaki-pin">
        <header className="emaki-header">
          <h2 className="section-title">
            <span className="section-kanji font-jp" aria-hidden="true">作</span>
            {labels.title}
          </h2>
          {/* No celular o rolo é arrastado, não rolado */}
          <p className="zen-hint">
            <span className="emaki-hint-scroll">{labels.hint}</span>
            <span className="emaki-hint-drag">{labels.hintDrag}</span>
          </p>
        </header>

        <div ref={viewportRef} className="emaki-viewport">
          <ol ref={trackRef} className="emaki-track" aria-label={labels.title}>
            <li className="emaki-rod" aria-hidden="true" />
            {projects.map((project, i) => {
              const href = `/projects/${project.slug}`;
              return (
                <li key={project.id} className="emaki-item">
                  <Link
                    href={href}
                    className="emaki-panel"
                    data-project={project.slug}
                    data-no-transition=""
                    onClick={(e) => onPanelClick(e, href)}
                    onFocus={(e) => revealPanel(e.currentTarget)}
                  >
                    <span className="emaki-number font-jp" aria-hidden="true">{KANJI_NUMBERS[i] ?? i + 1}</span>
                    <h3 className="emaki-title">{project.title}</h3>
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
            <li className="emaki-rod" aria-hidden="true" />
          </ol>
        </div>

        <div className="emaki-footer">
          <Link href="/projects" className="emaki-all">{labels.btnAll}</Link>
        </div>
      </div>
    </Section>
  );
}
