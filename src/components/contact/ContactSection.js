'use client';
import { useRef, useState } from 'react';
import { Mail, Linkedin, Github, Send } from 'lucide-react';
import { toast } from 'sonner';
import { gsap } from '../../lib/gsap';
import { journeyStore } from '../../store/journey';
import Section from '../journey/Section';
import { lanternLabel } from '../../lib/journey/lanterns';

const EMPTY = { name: '', email: '', message: '' };

// 灯籠流し: a mensagem vira uma lanterna de papel que desce o rio
function releaseLantern(card, name) {
  journeyStore.getState().releaseLantern(name);
  const label = lanternLabel(name);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    gsap.fromTo(lantern, { autoAlpha: 1 }, { autoAlpha: 0, delay: 1.5, duration: 0, onComplete: () => lantern.remove() });
    return;
  }
  gsap
    .timeline({ onComplete: () => lantern.remove() })
    // O papel do formulário "dobra"
    .to(card, { scaleY: 0.96, duration: 0.18, ease: 'power2.in' })
    .to(card, { scaleY: 1, duration: 0.3, ease: 'back.out(3)' })
    .fromTo(lantern, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' }, 0.1)
    // ...e a lanterna segue a correnteza
    .to(lantern, { y: 180, x: 90, rotate: 8, duration: 3, ease: 'sine.inOut' }, '>')
    .to(lantern, { autoAlpha: 0, duration: 0.8 }, '-=0.8');
}

// 縁 Contato: canais + formulário; ao enviar, a mensagem vira lanterna no rio da cena
export default function ContactSection({ contact }) {
  const [formData, setFormData] = useState(EMPTY);
  const [status, setStatus] = useState('idle');
  const cardRef = useRef(null);
  const { form, toast: messages } = contact;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    const loadingToast = toast.loading(messages.loading);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const { name } = formData;
        setFormData(EMPTY);
        toast.success(messages.success, { id: loadingToast });
        releaseLantern(cardRef.current, name);
      } else {
        toast.error(messages.error, { id: loadingToast });
      }
    } catch {
      toast.error(messages.network, { id: loadingToast });
    } finally {
      setStatus('idle');
    }
  };

  const loading = status === 'loading';

  return (
    <Section id="contato" className="contact-section">
      <div className="responsive-grid" style={{ alignItems: 'start' }}>
        <div className="contact-copy">
          <h2 className="section-title">
            <span className="section-kanji font-jp" aria-hidden="true">縁</span>
            {contact.title}
          </h2>
          <p className="contact-subtitle">{contact.subtitle}</p>

          <h3 className="contact-channels">{contact.channels}</h3>
          <a href="mailto:raphaelokuyama123@gmail.com" className="contact-link hover-nudge">
            <Mail size={24} aria-hidden="true" />
            <div>
              <strong>Email</strong>
              <span>raphaelokuyama123@gmail.com</span>
            </div>
          </a>
          <a href="https://www.linkedin.com/in/raphael-okuyama/" target="_blank" rel="noopener noreferrer" className="contact-link hover-nudge">
            <Linkedin size={24} aria-hidden="true" />
            <div>
              <strong>LinkedIn</strong>
              <span>/in/raphael-okuyama</span>
            </div>
          </a>
          <a href="https://github.com/RaphaelOkuyama" target="_blank" rel="noopener noreferrer" className="contact-link hover-nudge">
            <Github size={24} aria-hidden="true" />
            <div>
              <strong>GitHub</strong>
              <span>/RaphaelOkuyama</span>
            </div>
          </a>
        </div>

        <div ref={cardRef} className="contact-card">
          <form onSubmit={handleSubmit}>
            <label className="contact-label" htmlFor="contact-name">{form.nameLabel}</label>
            <input id="contact-name" className="contact-input" type="text" name="name" placeholder={form.namePlaceholder} value={formData.name} onChange={handleChange} required />

            <label className="contact-label" htmlFor="contact-email">{form.emailLabel}</label>
            <input id="contact-email" className="contact-input" type="email" name="email" placeholder={form.emailPlaceholder} value={formData.email} onChange={handleChange} required />

            <label className="contact-label" htmlFor="contact-message">{form.messageLabel}</label>
            <textarea id="contact-message" className="contact-input" name="message" rows="5" placeholder={form.messagePlaceholder} value={formData.message} onChange={handleChange} required style={{ resize: 'none' }} />

            <button type="submit" disabled={loading} className="btn-press contact-submit">
              {loading ? contact.sending : form.btn}
              {!loading && <Send size={18} aria-hidden="true" />}
            </button>
          </form>
        </div>
      </div>
    </Section>
  );
}
