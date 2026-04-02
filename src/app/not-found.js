'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, TerminalSquare } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function NotFound() {
  const { language } = useSettings();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const text = {
    pt: {
      subtitle: "Página não encontrada",
      desc: "Parece que você navegou para fora do mapa. A rota que você tentou acessar não existe ou foi refatorada.",
      btn: "Voltar para a base"
    },
    en: {
      subtitle: "Page Not Found",
      desc: "Looks like you navigated off the map. The route you tried to access doesn't exist or was refactored.",
      btn: "Return to base"
    }
  };

  const t = text[language] || text.pt;

  return (
    <div style={{ 
      minHeight: '85vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      <motion.div 
        animate={{ 
          x: mousePosition.x * -30, 
          y: mousePosition.y * -30 
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        style={{
          position: 'absolute',
          fontSize: 'clamp(12rem, 35vw, 30rem)',
          fontWeight: '900',
          color: 'var(--accent)',
          opacity: 0.05,
          zIndex: -1,
          userSelect: 'none',
          lineHeight: 1,
          pointerEvents: 'none'
        }}
      >
        404
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}
      >
        <TerminalSquare size={56} color="var(--accent)" />
        <motion.div 
          animate={{ opacity: [1, 0, 1] }} 
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          style={{ width: '25px', height: '6px', background: 'var(--accent)', marginTop: '20px' }}
        />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '15px', color: 'var(--text-primary)' }}
      >
        {t.subtitle}
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '40px' }}
      >
        {t.desc}
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(59, 130, 246, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 30px', borderRadius: '50px',
              border: '1px solid var(--accent)', background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--accent)', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '1rem',
              transition: '0.3s'
            }}
          >
            <ArrowLeft size={20} /> {t.btn}
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}