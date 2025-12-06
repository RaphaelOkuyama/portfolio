'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe, Menu, X, Github, Linkedin, Mail } from 'lucide-react'; // Importei os ícones sociais
import { useSettings } from '../context/SettingsContext';

export default function Navbar() {
  const pathname = usePathname();
  const { toggleTheme, toggleLanguage, theme, language, currentData } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const links = [
    { name: currentData.nav.home, path: '/' },
    { name: currentData.nav.projects, path: '/projects' },
    { name: currentData.nav.certificates, path: '/certificates' },
    { name: currentData.nav.contact, path: '/contact' },
  ];

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, padding: '20px 0', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', zIndex: 51 }}>
            Raphael Okuyama
          </Link>
          
          {/* DESKTOP MENU */}
          <div className="desktop-menu" style={{ alignItems: 'center', gap: '30px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {links.map((link) => (
                <Link key={link.path} href={link.path} style={{ position: 'relative', color: pathname === link.path ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {link.name}
                  {pathname === link.path && (
                    <motion.div layoutId="underline" style={{ position: 'absolute', bottom: '-5px', left: 0, width: '100%', height: '2px', background: 'var(--accent)' }} />
                  )}
                </Link>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '15px', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
              <button onClick={toggleLanguage} style={btnStyle}><Globe size={20} /><span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{language.toUpperCase()}</span></button>
              <button onClick={toggleTheme} style={btnStyle}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button className="mobile-menu-btn" onClick={toggleMenu} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', zIndex: 51 }}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
              <button onClick={toggleLanguage} style={{...btnStyle, transform: 'scale(1.2)'}}><Globe size={24} /> {language.toUpperCase()}</button>
              <button onClick={toggleTheme} style={{...btnStyle, transform: 'scale(1.2)'}}>{theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const btnStyle = { background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };

