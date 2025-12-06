'use client';
import { Github, Linkedin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

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
    transition: '0.3s',
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
      <motion.a 
        href="https://github.com/RaphaelOkuyama" 
        target="_blank" 
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1, color: 'var(--accent)', borderColor: 'var(--accent)', y: -3 }}
        style={iconStyle}
        title="GitHub"
      >
        <Github size={20} />
      </motion.a>

      {/* LinkedIn */}
      <motion.a 
        href="https://www.linkedin.com/in/raphael-okuyama/" 
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1, color: 'var(--accent)', borderColor: 'var(--accent)', y: -3 }}
        style={iconStyle}
        title="LinkedIn"
      >
        <Linkedin size={20} />
      </motion.a>

      {/* Email */}
      <motion.a 
        href="mailto:raphaelokuyama123@gmail.com"
        whileHover={{ scale: 1.1, color: 'var(--accent)', borderColor: 'var(--accent)', y: -3 }}
        style={iconStyle}
        title="Email"
      >
        <Mail size={20} />
      </motion.a>
      
      {/* Linha decorativa */}
      <div style={{ width: '1px', height: '60px', background: 'var(--border)', margin: '0 auto' }} />
    </div>
  );
}