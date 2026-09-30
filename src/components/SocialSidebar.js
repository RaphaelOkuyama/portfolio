'use client';
import { Github, Linkedin, Mail } from 'lucide-react';

export default function SocialSidebar() {
  const iconStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  return (
    <div 
      className="social-sidebar" // <--- CLASSE ADICIONADA AQUI
      style={{ 
        position: 'fixed', 
        bottom: '30px', 
        right: '30px', 
        zIndex: 9990
        // Removi display: flex daqui pois agora é controlado pelo CSS
      }}
    >
      {/* GitHub */}
      <a 
        href="https://github.com/RaphaelOkuyama" 
        target="_blank" 
        rel="noopener noreferrer"
        className="icon-pop"
        style={iconStyle}
        title="GitHub"
      >
        <Github size={20} />
      </a>

      {/* LinkedIn */}
      <a 
        href="https://www.linkedin.com/in/raphael-okuyama/" 
        target="_blank"
        rel="noopener noreferrer"
        className="icon-pop"
        style={iconStyle}
        title="LinkedIn"
      >
        <Linkedin size={20} />
      </a>

      {/* Email */}
      <a 
        href="mailto:raphaelokuyama123@gmail.com"
        className="icon-pop"
        style={iconStyle}
        title="Email"
      >
        <Mail size={20} />
      </a>
      
      {/* Linha decorativa */}
      <div style={{ width: '1px', height: '60px', background: 'var(--border)', margin: '0 auto' }} />
    </div>
  );
}