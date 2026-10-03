'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, RefreshCw, X } from 'lucide-react';
import { gsap } from '../../lib/gsap';
import { profile } from '../../data/resume';
import { SITE_URL, SOCIAL } from '../../lib/site';
import { buildVCard, VCARD_FILENAME } from '../../lib/meishi';

const host = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

// 名刺: o cartão de visita. No Japão ele é entregue com as duas mãos, virado para quem recebe:
// aqui ele chega de cabeça para baixo e gira até ficar de frente. Frente em japonês, verso em latim,
// e o QR leva o vCard para o celular de quem estiver olhando a tela
export default function Meishi({ labels, role }) {
  const dialogRef = useRef(null);
  const cardRef = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const [qr, setQr] = useState('');
  const vcard = buildVCard({ title: role });

  useEffect(() => {
    let alive = true;
    QRCode.toString(vcard, { type: 'svg', margin: 0, errorCorrectionLevel: 'L', color: { dark: '#1b1a17', light: '#0000' } })
      .then((svg) => { if (alive) setQr(svg); })
      .catch(() => {});
    return () => { alive = false; };
  }, [vcard]);

  const open = () => {
    const dialog = dialogRef.current;
    setFlipped(false);
    dialog.showModal();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(cardRef.current,
      { rotate: 180, y: 80, scale: 0.85, opacity: 0 },
      { rotate: 0, y: 0, scale: 1, opacity: 1, duration: 1.1, ease: 'power3.out' });
  };

  const close = () => dialogRef.current?.close();

  const save = () => {
    const url = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = VCARD_FILENAME;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <button type="button" className="meishi-open hover-nudge" onClick={open}>
        <span className="meishi-open-kanji font-jp" aria-hidden="true">名刺</span>
        {labels.open}
      </button>

      {/* Clique no fundo (fora do conteúdo) fecha, como um modal comum */}
      <dialog
        ref={dialogRef}
        className="meishi-dialog"
        aria-labelledby="meishi-title"
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}
      >
        <div className="meishi-body">
          <button type="button" className="meishi-close" onClick={close} aria-label={labels.close}>
            <X size={20} aria-hidden="true" />
          </button>
          <h2 id="meishi-title" className="meishi-title">
            <span className="font-jp" aria-hidden="true">名刺</span> {labels.title}
          </h2>

          <div ref={cardRef} className="meishi-stage">
            <div className={`meishi-card${flipped ? ' is-flipped' : ''}`} data-meishi-card="">
              {/* Frente: o lado japonês */}
              <div className="meishi-face meishi-front" lang="ja" aria-hidden={flipped}>
                <span className="meishi-role-jp font-jp">フルスタック開発者</span>
                <span className="meishi-name-jp font-jp">{profile.nameKanji}</span>
                <span className="meishi-kana font-jp">{profile.nameKatakana}</span>
                <span className="meishi-hanko font-jp" aria-hidden="true">奥山</span>
              </div>
              {/* Verso: o lado latino, com o QR do vCard */}
              <div className="meishi-face meishi-back" aria-hidden={!flipped}>
                <div className="meishi-back-text">
                  <strong className="meishi-name">{profile.name}</strong>
                  <span className="meishi-role">{role}</span>
                  <span>{SOCIAL.email}</span>
                  <span>{host(SITE_URL)}</span>
                  <span>{host(SOCIAL.linkedin)}</span>
                  <span>{host(SOCIAL.github)}</span>
                </div>
                {qr && (
                  <span
                    className="meishi-qr"
                    role="img"
                    aria-label={labels.qr}
                    dangerouslySetInnerHTML={{ __html: qr }}
                  />
                )}
              </div>
            </div>
          </div>

          <p className="meishi-note">{labels.note}</p>
          <div className="meishi-actions">
            <button type="button" className="meishi-btn" onClick={() => setFlipped((f) => !f)}>
              <RefreshCw size={16} aria-hidden="true" /> {labels.flip}
            </button>
            <button type="button" className="meishi-btn is-primary" onClick={save}>
              <Download size={16} aria-hidden="true" /> {labels.save}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
