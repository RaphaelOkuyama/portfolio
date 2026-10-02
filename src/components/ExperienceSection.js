'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { gsap, useGSAP } from '../lib/gsap';
import { sumiPath } from '../lib/journey/sumi';
import { useSettings } from '../context/SettingsContext';
import {
  currentMonth, formatMonth, formatPeriod, formatDuration, monthsBetween, orderTimeline,
} from '../lib/experience';
import Section from './journey/Section';

function ExperienceCard({ exp, labels, lang, today }) {
  const months = monthsBetween(exp.start, exp.end ?? today);
  return (
    <article className="exp-card">
      <header className="exp-head">
        <p className="exp-period">
          {formatPeriod(exp.start, exp.end, lang, labels.current)}
          {/* A duração depende do mês de hoje: o servidor e o navegador podem divergir na virada */}
          <span className="exp-duration" suppressHydrationWarning> · {formatDuration(months, lang)}</span>
        </p>
        {(exp.type || exp.parallel) && (
          <p className="exp-badges">
            {exp.type && <span className="exp-badge">{exp.type}</span>}
            {exp.parallel && <span className="exp-badge is-parallel">{labels.parallel}</span>}
          </p>
        )}
        <h3 className="exp-company">{exp.company}</h3>
        <p className="exp-role">{exp.role}</p>
      </header>

      <p className="exp-summary">{exp.summary}</p>
      <ul className="exp-highlights">
        {exp.highlights.map((h) => (
          <li key={h.text} className={h.value ? 'has-value' : undefined}>
            {h.value && <strong className="exp-value">{h.value}</strong>}
            <span>{h.text}</span>
          </li>
        ))}
      </ul>

      <ul className="exp-tags" aria-label={labels.tags}>
        {exp.tags.map((tag) => <li key={tag}>{tag}</li>)}
      </ul>

      {exp.link && (
        <Link href={exp.link} className="exp-link hover-nudge">
          {labels.viewProject} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}

// 歩 Experiência: a pincelada sumi-e desce pela lateral e cada marco ganha uma gota de tinta.
// Do mais recente para o mais antigo, terminando na formação
export default function ExperienceSection({ experience, education, labels, title }) {
  const rootRef = useRef(null);
  const timelineRef = useRef(null);
  const { language } = useSettings();
  const today = currentMonth();
  const entries = useMemo(() => orderTimeline(experience, today), [experience, today]);
  const entriesKey = entries.map((e) => e.id).join('|');

  // Altura da linha do tempo para desenhar a pincelada no tamanho real (sem distorcer o traço)
  const [brushHeight, setBrushHeight] = useState(0);
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setBrushHeight(Math.round(entry.contentRect.height)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    if (brushHeight > 0) {
      gsap.fromTo('.sumi-stroke', { drawSVG: '0%' }, {
        drawSVG: '100%',
        ease: 'none',
        scrollTrigger: { trigger: timelineRef.current, start: 'top 65%', end: 'bottom 55%', scrub: 0.5 },
      });
    }
    // Gota de tinta se espalha quando o marco chega; o cartão entra logo atrás
    gsap.utils.toArray('.exp-item').forEach((item) => {
      gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 75%', toggleActions: 'play none none reverse' } })
        .fromTo(item.querySelector('.ink-drop'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0)
        .from(item.querySelector('.exp-card'), { opacity: 0, x: 24, duration: 0.6, ease: 'power3.out' }, 0.05);
    });
  // Os mesmos marcos nos dois idiomas: trocar o idioma não refaz as animações (só o texto muda)
  }, { scope: rootRef, dependencies: [entriesKey, brushHeight], revertOnUpdate: true });

  return (
    <Section id="experience" ref={rootRef} className="exp-section">
      <h2 className="section-title">
        <span className="section-kanji font-jp" aria-hidden="true">歩</span>
        {title}
      </h2>

      <div ref={timelineRef} className="exp-timeline">
        {brushHeight > 0 && (
          <svg
            className="sumi-brush"
            aria-hidden="true"
            width="40"
            height={brushHeight}
            viewBox={`0 0 40 ${brushHeight}`}
          >
            <path className="sumi-track" d={sumiPath(brushHeight)} />
            <path className="sumi-stroke" d={sumiPath(brushHeight)} />
          </svg>
        )}

        <ol className="exp-list">
          {entries.map((exp) => (
            <li key={exp.id} className="exp-item">
              <span className="ink-drop" aria-hidden="true" />
              <ExperienceCard exp={exp} labels={labels} lang={language} today={today} />
            </li>
          ))}

          {/* Formação: marco com outro traço (anel vazado e carimbo 学) */}
          <li className="exp-item is-education">
            <span className="ink-drop is-ring" aria-hidden="true" />
            <article className="exp-card">
              <span className="exp-hanko font-jp" aria-hidden="true">学</span>
              <header className="exp-head">
                <p className="exp-period">
                  {labels.expected}: {formatMonth(education.end, language)}
                </p>
                <p className="exp-badges"><span className="exp-badge">{labels.education}</span></p>
                <h3 className="exp-company">{education.institution}</h3>
                <p className="exp-role">{education.course}</p>
              </header>
              <p className="exp-summary">{education.summary}</p>
            </article>
          </li>
        </ol>
      </div>
    </Section>
  );
}
