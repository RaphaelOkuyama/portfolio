'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ProjectImageCarousel
 * 
 * Exibe screenshots de projetos mobile em formato de mockup de celular.
 * Aceita um array de objetos { src, alt }.
 * 
 * Uso no resume.js:
 *   images: [
 *     { src: 'https://...', alt: 'Tela inicial' },
 *     { src: 'https://...', alt: 'Cardápio' },
 *   ]
 * 
 * No ProjectDetails.jsx, substitua o bloco de imagem por:
 *   {project.images?.length > 0
 *     ? <ProjectImageCarousel images={project.images} isMobile={project.imageMobile} />
 *     : <div>sem imagem</div>
 *   }
 */
export default function ProjectImageCarousel({ images = [], isMobile = false }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  if (!images || images.length === 0) return null;

  const go = (dir) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + images.length) % images.length);
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  // Layout mobile (portrait screenshots) — exibe como mockup de celular
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', margin: '40px 0' }}>
        
        {/* Frame do celular */}
        <div style={{ position: 'relative', width: '240px' }}>
          {/* Moldura do celular */}
          <div style={{
            position: 'relative',
            width: '240px',
            height: '480px',
            background: '#1a1a1a',
            borderRadius: '32px',
            padding: '12px 8px',
            boxShadow: '0 0 0 2px #333, 0 20px 60px rgba(0,0,0,0.4)',
          }}>
            {/* Notch */}
            <div style={{
              position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
              width: '60px', height: '8px', background: '#111',
              borderRadius: '4px', zIndex: 10,
            }} />
            
            {/* Tela */}
            <div style={{
              width: '100%', height: '100%',
              borderRadius: '24px',
              overflow: 'hidden',
              background: '#000',
              position: 'relative',
            }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.img
                  key={current}
                  src={images[current].src}
                  alt={images[current].alt || `Tela ${current + 1}`}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    display: 'block',
                  }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Botão esquerdo */}
          {images.length > 1 && (
            <button
              onClick={() => go(-1)}
              style={{
                position: 'absolute', left: '-44px', top: '50%', transform: 'translateY(-50%)',
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-primary)', transition: '0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Botão direito */}
          {images.length > 1 && (
            <button
              onClick={() => go(1)}
              style={{
                position: 'absolute', right: '-44px', top: '50%', transform: 'translateY(-50%)',
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-primary)', transition: '0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Caption da tela atual */}
        {images[current].alt && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
            {images[current].alt}
          </p>
        )}

        {/* Dots de navegação */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                style={{
                  width: i === current ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === current ? 'var(--accent)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Layout desktop (landscape screenshots) — carrossel normal 16/9
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '50px', background: 'var(--card-bg)' }}>
      <AnimatePresence custom={direction} mode="wait">
        <motion.img
          key={current}
          src={images[current].src}
          alt={images[current].alt || `Screenshot ${current + 1}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button onClick={() => go(-1)} style={arrowStyle('left')}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => go(1)} style={arrowStyle('right')}>
            <ChevronRight size={20} />
          </button>
          <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
            {images.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                style={{ width: i === current ? '20px' : '8px', height: '8px', borderRadius: '4px', background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const arrowStyle = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: '12px',
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.5)',
  border: 'none',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#fff',
  zIndex: 10,
});