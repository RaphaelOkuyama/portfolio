'use client';
import { useEffect, useRef, useState } from 'react';
import { Mail, Linkedin, Github, Send, Copy, Check, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { gsap } from '../../lib/gsap';
import { journeyStore } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import { fieldErrors, LIMITS } from '../../lib/contactMail';
import Section from '../journey/Section';
import { lanternLabel } from '../../lib/journey/lanterns';
import { resumeData } from '../../data/resume';
import Meishi from './Meishi';
import Ruby from '../Ruby';

const EMPTY = { name: '', email: '', message: '' };
const EMAIL = 'raphaelokuyama123@gmail.com';
const FIELDS = ['name', 'email', 'message'];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// 灯籠流し: a carta recebe o carimbo 縁 e vira uma lanterna de papel que desce o rio
function releaseLantern(card, seal, name) {
  journeyStore.getState().releaseLantern(name);
  const label = lanternLabel(name);
  const reduced = prefersReducedMotion();
  const lantern = document.createElement('div');
  lantern.className = 'paper-lantern';
  lantern.setAttribute('data-lantern-release', '');
  lantern.setAttribute('aria-hidden', 'true');
  // O nome de quem escreveu vai pintado no papel (como texto, nunca como HTML)
  if (label) {
    const ink = document.createElement('span');
    ink.className = Array.from(label).length > 5 ? 'paper-lantern-name is-long' : 'paper-lantern-name';
    ink.textContent = label;
    lantern.appendChild(ink);
  }
  card.appendChild(lantern);

  if (reduced) {
    gsap.set(seal, { autoAlpha: 1 });
    gsap.fromTo(lantern, { autoAlpha: 1 }, { autoAlpha: 0, delay: 1.5, duration: 0, onComplete: () => lantern.remove() });
    gsap.to(seal, { autoAlpha: 0, delay: 1.5, duration: 0 });
    return;
  }
  gsap
    .timeline({ onComplete: () => lantern.remove() })
    // Carimbo 縁 na carta
    .fromTo(seal, { autoAlpha: 0, scale: 1.8, rotate: -18 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.35, ease: 'hanko' })
    // O papel "dobra"...
    .to(card, { scaleY: 0.96, duration: 0.18, ease: 'power2.in' }, '+=0.15')
    .to(card, { scaleY: 1, duration: 0.3, ease: 'back.out(3)' })
    .fromTo(lantern, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' }, '<')
    // ...e a lanterna segue a correnteza
    .to(lantern, { y: 180, x: 90, rotate: 8, duration: 3, ease: 'sine.inOut' }, '>')
    .to(lantern, { autoAlpha: 0, duration: 0.8 }, '-=0.8')
    .to(seal, { autoAlpha: 0, duration: 0.6 }, '-=1.2');
}

function Field({ id, label, error, children }) {
  return (
    <div className="contact-field" data-invalid={Boolean(error) || undefined}>
      <label className="contact-label" htmlFor={id}>{label}</label>
      {children}
      {/* Sempre no DOM: o leitor de tela anuncia quando o erro aparece */}
      <p id={`${id}-error`} className="contact-error" aria-live="polite">{error}</p>
    </div>
  );
}

// 縁 Contato: a apresentação e a disponibilidade, a carta (手紙) e os canais diretos
export default function ContactSection({ contact }) {
  const { language } = useSettings();
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [sentTo, setSentTo] = useState(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);
  const sealRef = useRef(null);
  const sentRef = useRef(null);
  const honeypotRef = useRef(null);
  const nameRef = useRef(null);
  const { form, toast: messages } = contact;
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';

  const errorText = (field) => (errors[field] ? contact.errors[field][errors[field]] : '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Corrigiu o campo: o aviso some na hora
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Ao sair de um campo já preenchido, confere só ele
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!value.trim()) return;
    const error = fieldErrors({ ...formData, [name]: value })[name];
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = fieldErrors(formData);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(`contact-${FIELDS.find((f) => found[f])}`)?.focus();
      return;
    }
    setStatus('loading');
    const loadingToast = toast.loading(messages.loading);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // O campo isca só vai junto se alguém (um robô) preencheu
        body: JSON.stringify(honeypotRef.current?.value ? { ...formData, company: honeypotRef.current.value } : formData),
      });
      if (res.ok) {
        const { name } = formData;
        setFormData(EMPTY);
        setErrors({});
        toast.success(messages.success, { id: loadingToast });
        releaseLantern(cardRef.current, sealRef.current, name);
        setSentTo(name.trim());
      } else if (res.status === 429) {
        toast.error(messages.rate, { id: loadingToast });
      } else if (res.status === 503) {
        // Envio fora do ar: o visitante não fica sem caminho, recebe o e-mail direto
        toast.error(messages.unavailable, { id: loadingToast, duration: 8000 });
      } else {
        toast.error(messages.error, { id: loadingToast });
      }
    } catch {
      toast.error(messages.network, { id: loadingToast });
    } finally {
      setStatus('idle');
    }
  };

  // Troca de estado da carta: o foco vai para o agradecimento ou volta para o primeiro campo
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (sentTo !== null) sentRef.current?.focus();
    else nameRef.current?.focus();
  }, [sentTo]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      toast.success(contact.copied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  const loading = status === 'loading';
  const count = formData.message.length;

  return (
    <Section id="contato" className="contact-section">
      <div className="contact-grid">
        <div className="contact-intro">
          <h2 className="section-title">
            <span className="section-kanji font-jp" aria-hidden="true"><Ruby>縁</Ruby></span>
            {contact.title}
          </h2>
          <p className="contact-subtitle">{contact.subtitle}</p>
          <div className="contact-availability">
            <span className="contact-availability-label">{contact.availabilityLabel}</span>
            <ul>
              {contact.availability.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <p className="contact-location">
            <MapPin size={16} aria-hidden="true" /> {contact.location}
          </p>
        </div>

        <div ref={cardRef} className="contact-letter">
          <span className="contact-letter-mark font-jp" aria-hidden="true">{contact.letter}</span>
          <span ref={sealRef} className="contact-seal font-jp" data-seal="" aria-hidden="true">縁</span>

          {sentTo !== null ? (
            <div ref={sentRef} className="contact-sent" tabIndex={-1} role="status">
              <span className="contact-sent-lantern" aria-hidden="true">灯</span>
              <h3>{contact.sent.title.replace('{name}', sentTo)}</h3>
              <p>{contact.sent.text}</p>
              <button type="button" className="contact-again hover-back" onClick={() => setSentTo(null)}>
                {contact.sent.again}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Isca para robôs: invisível e fora da navegação por teclado e leitores de tela */}
              <div className="contact-honeypot" aria-hidden="true">
                <label htmlFor="contact-company">Empresa</label>
                <input ref={honeypotRef} id="contact-company" type="text" name="company" tabIndex={-1} autoComplete="off" />
              </div>

              <Field id="contact-name" label={form.nameLabel} error={errorText('name')}>
                <input
                  ref={nameRef} id="contact-name" className="contact-input" type="text" name="name"
                  placeholder={form.namePlaceholder} value={formData.name} onChange={handleChange} onBlur={handleBlur}
                  required maxLength={LIMITS.name} autoComplete="name"
                  aria-invalid={Boolean(errors.name)} aria-describedby="contact-name-error"
                />
              </Field>

              <Field id="contact-email" label={form.emailLabel} error={errorText('email')}>
                <input
                  id="contact-email" className="contact-input" type="email" name="email"
                  placeholder={form.emailPlaceholder} value={formData.email} onChange={handleChange} onBlur={handleBlur}
                  required maxLength={LIMITS.email} autoComplete="email" inputMode="email"
                  aria-invalid={Boolean(errors.email)} aria-describedby="contact-email-error"
                />
              </Field>

              <Field id="contact-message" label={form.messageLabel} error={errorText('message')}>
                <textarea
                  id="contact-message" className="contact-input" name="message" rows="5"
                  placeholder={form.messagePlaceholder} value={formData.message} onChange={handleChange} onBlur={handleBlur}
                  required maxLength={LIMITS.message}
                  aria-invalid={Boolean(errors.message)} aria-describedby="contact-message-error contact-message-count"
                />
                <span
                  id="contact-message-count"
                  className="contact-counter"
                  data-near={count > LIMITS.message * 0.9 || undefined}
                >
                  {count.toLocaleString(locale)} / {LIMITS.message.toLocaleString(locale)}
                </span>
              </Field>

              <p className="contact-hint">
                <span className="font-jp" aria-hidden="true">灯</span> {contact.lanternHint}
              </p>
              <button type="submit" disabled={loading} className="btn-press contact-submit">
                {loading ? contact.sending : form.btn}
                {!loading && <Send size={18} aria-hidden="true" />}
              </button>
            </form>
          )}
        </div>

        <div className="contact-direct">
          <h3 className="contact-channels">{contact.channels}</h3>
          <ul className="contact-links">
            <li className="contact-link-row">
              <a href={`mailto:${EMAIL}`} className="contact-link hover-nudge">
                <Mail size={20} aria-hidden="true" />
                <span><strong>E-mail</strong><span>{EMAIL}</span></span>
              </a>
              <button
                type="button"
                className="contact-copy-btn"
                onClick={copyEmail}
                aria-label={copied ? contact.copied : contact.copyEmail}
                title={contact.copyEmail}
              >
                {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              </button>
            </li>
            <li className="contact-link-row">
              <a href="https://www.linkedin.com/in/raphael-okuyama/" target="_blank" rel="noopener noreferrer" className="contact-link hover-nudge">
                <Linkedin size={20} aria-hidden="true" />
                <span><strong>LinkedIn</strong><span>/in/raphael-okuyama</span></span>
              </a>
            </li>
            <li className="contact-link-row">
              <a href="https://github.com/RaphaelOkuyama" target="_blank" rel="noopener noreferrer" className="contact-link hover-nudge">
                <Github size={20} aria-hidden="true" />
                <span><strong>GitHub</strong><span>/RaphaelOkuyama</span></span>
              </a>
            </li>
          </ul>
          <Meishi labels={contact.meishi} role={resumeData[language].hero.roles[0]} />
        </div>
      </div>
    </Section>
  );
}
