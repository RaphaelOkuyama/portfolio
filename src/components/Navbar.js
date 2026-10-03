'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { Sun, Moon, Globe, Menu, X, Github, Linkedin, Mail } from 'lucide-react'; // Importei os ícones sociais
import { useSettings } from '../context/SettingsContext';
import Kamon from './Kamon';

export default function Navbar() {
  const pathname = usePathname();
  const { toggleTheme, toggleLanguage, theme, language, currentData } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const links = [
    { name: currentData.nav.home, path: '/' },
    { name: currentData.nav.projects, path: '/projects' },
    { name: currentData.nav.certificates, path: '/certificates' },
    { name: currentData.nav.contact, path: '/#contato' },
  ];

  // Menu mobile: continua montado durante a animação de saída
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const menuRef = useRef(null);
  const navRef = useRef(null);

  const toggleMenu = () => {
    if (!isMobileMenuOpen) setIsMenuMounted(true);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useGSAP(() => {
    if (!isMenuMounted || !menuRef.current) return;
    if (isMobileMenuOpen) {
      gsap.fromTo(menuRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(menuRef.current, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in', onComplete: () => setIsMenuMounted(false) });
    }
  }, { dependencies: [isMobileMenuOpen, isMenuMounted] });

  const themeLabel = language === 'pt' ? 'Alternar dia/noite' : 'Toggle day/night';
  const languageLabel = language === 'pt' ? 'Mudar idioma para inglês' : 'Switch language to Portuguese';

  // Ícone do toggle 昼/夜 gira e entra ao trocar de tema
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(
      '.theme-icon',
      { rotate: -90, scale: 0.6, opacity: 0 },
      { rotate: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
    );
  }, { scope: navRef, dependencies: [theme], revertOnUpdate: true });

  return (
    <div ref={navRef} style={{ display: 'contents' }}>
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, padding: '20px 0', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <Link href="/" className="nav-brand" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', zIndex: 51 }}>
            <Kamon size={28} className="nav-kamon" />
            Raphael Okuyama
          </Link>
          
          {/* DESKTOP MENU */}
          <div className="desktop-menu" style={{ alignItems: 'center', gap: '30px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {links.map((link) => (
                <Link key={link.path} href={link.path} style={{ position: 'relative', color: pathname === link.path ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {link.name}
                  {pathname === link.path && (
                    <div className="nav-underline" style={{ position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '2px', background: 'var(--accent)' }} />
                  )}
                </Link>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '15px', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
              <button onClick={toggleLanguage} style={btnStyle} aria-label={languageLabel}><Globe size={20} /><span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{language.toUpperCase()}</span></button>
              <button onClick={toggleTheme} style={btnStyle} aria-label={themeLabel}><span className="theme-icon" style={{ display: 'inline-flex' }}>{theme === 'night' ? <Sun size={20} /> : <Moon size={20} />}</span></button>
            </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="mobile-menu-btn"
            onClick={toggleMenu}
            aria-label={isMobileMenuOpen ? (language === 'pt' ? 'Fechar menu' : 'Close menu') : (language === 'pt' ? 'Abrir menu' : 'Open menu')}
            aria-expanded={isMobileMenuOpen}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', zIndex: 51 }}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {isMenuMounted && (
          <div
            ref={menuRef}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
              background: 'var(--bg-color)', zIndex: 49, paddingTop: '100px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px'
            }}
          >
            {links.map((link) => (
              <Link 
                key={link.path} 
                href={link.path} 
                onClick={toggleMenu}
                style={{ fontSize: '1.5rem', fontWeight: 'bold', color: pathname === link.path ? 'var(--accent)' : 'var(--text-primary)' }}
              >
                {link.name}
              </Link>
            ))}

            {/* Ícones Sociais no Mobile (NOVO) */}
            <div style={{ display: 'flex', gap: '25px', marginTop: '10px' }}>
              <a href="https://github.com/RaphaelOkuyama" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>
                <Github size={28} />
              </a>
              <a href="https://www.linkedin.com/in/raphael-okuyama/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>
                <Linkedin size={28} />
              </a>
              <a href="mailto:raphaelokuyama123@gmail.com" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={28} />
              </a>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <button onClick={toggleLanguage} style={{...btnStyle, transform: 'scale(1.2)'}} aria-label={languageLabel}><Globe size={24} /> {language.toUpperCase()}</button>
              <button onClick={toggleTheme} style={{...btnStyle, transform: 'scale(1.2)'}} aria-label={themeLabel}><span className="theme-icon" style={{ display: 'inline-flex' }}>{theme === 'night' ? <Sun size={24} /> : <Moon size={24} />}</span></button>
            </div>
          </div>
      )}
    </div>
  );
}

const btnStyle = { background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };

