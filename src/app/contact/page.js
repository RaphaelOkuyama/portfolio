'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, Send } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'sonner';

export default function Contact() {
  const { currentData } = useSettings();
  const { contactPage } = currentData;

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(''); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    const loadingToast = toast.loading('Enviando mensagem...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setStatus('idle');
        setFormData({ name: '', email: '', message: '' });
        toast.success('Mensagem enviada com sucesso!', { id: loadingToast });
      } else {
        setStatus('idle');
        toast.error('Erro ao enviar mensagem. Tente novamente.', { id: loadingToast });
      }
    } catch (error) {
      setStatus('idle');
      toast.error('Erro de conexão. Verifique sua rede.', { id: loadingToast });
    }
  };

  const inputStyle = {
    width: '100%', padding: '15px', background: 'var(--card-bg)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none', marginBottom: '15px', fontFamily: 'inherit'
  };

  const socialItemStyle = {
    display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'var(--card-bg)',
    border: '1px solid var(--border)', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-primary)',
    marginBottom: '15px', transition: '0.3s', cursor: 'pointer'
  };

  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: '1200px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="responsive-grid"
        style={{ alignItems: 'start' }}
      >
        
        <div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3rem)', marginBottom: '20px', lineHeight: 1.1 }}>{contactPage.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem', lineHeight: 1.6 }}>{contactPage.subtitle}</p>

          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--accent)' }}>{contactPage.channels}</h3>
            
            <motion.a href="mailto:raphaelokuyama123@gmail.com" style={socialItemStyle} whileHover={{ x: 5, borderColor: 'var(--accent)' }}>
              <Mail size={24} color="var(--accent)" />
              <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Email</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>raphaelokuyama123@gmail.com</span>
              </div>
            </motion.a>
            <motion.a href="https://www.linkedin.com/in/raphael-okuyama/" target="_blank" style={socialItemStyle} whileHover={{ x: 5, borderColor: 'var(--accent)' }}>
              <Linkedin size={24} color="var(--accent)" />
              <div><strong style={{ display: 'block', fontSize: '0.9rem' }}>LinkedIn</strong><span style={{ color: 'var(--text-secondary)' }}>/in/raphael-okuyama</span></div>
            </motion.a>
            <motion.a href="https://github.com/RaphaelOkuyama" target="_blank" style={socialItemStyle} whileHover={{ x: 5, borderColor: 'var(--accent)' }}>
              <Github size={24} color="var(--accent)" />
              <div><strong style={{ display: 'block', fontSize: '0.9rem' }}>GitHub</strong><span style={{ color: 'var(--text-secondary)' }}>/RaphaelOkuyama</span></div>
            </motion.a>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', padding: 'clamp(20px, 5vw, 40px)', borderRadius: '20px', border: '1px solid var(--border)', width: '100%' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>{contactPage.form.nameLabel}</label>
              <input type="text" name="name" placeholder={contactPage.form.namePlaceholder} style={inputStyle} value={formData.name} onChange={handleChange} required />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>{contactPage.form.emailLabel}</label>
              <input type="email" name="email" placeholder={contactPage.form.emailPlaceholder} style={inputStyle} value={formData.email} onChange={handleChange} required />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>{contactPage.form.messageLabel}</label>
              <textarea name="message" rows="5" placeholder={contactPage.form.messagePlaceholder} style={{ ...inputStyle, resize: 'none' }} value={formData.message} onChange={handleChange} required />
            </div>
            
            <motion.button 
              type="submit" disabled={status === 'loading'} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ 
                width: '100%', padding: '15px', background: 'var(--accent)', color: '#fff', 
                border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px', opacity: status === 'loading' ? 0.7 : 1
              }}
            >
              {status === 'loading' ? 'Enviando...' : contactPage.form.btn} 
              {status !== 'loading' && <Send size={18} />}
            </motion.button>
          </form>
        </div>

      </motion.div>
    </div>
  );
}