'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { resumeData } from '../data/resume';
import { normalizeTheme } from '../lib/palette';

const SettingsContext = createContext();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Storage bloqueado (aba privada etc.): o tema só não persiste
  }
}

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState('pt');
  const [theme, setTheme] = useState('night');

  // Alternar 昼/夜
  const toggleTheme = () => {
    const next = theme === 'night' ? 'day' : 'night';
    setTheme(next);
    applyTheme(next);
  };

  // Alternar Idioma
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'pt' ? 'en' : 'pt'));
  };

  // Carregar preferência salva (aceita valores antigos 'dark'/'light')
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem('theme');
    } catch {
      saved = null;
    }
    const initial = normalizeTheme(saved);
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Leitores de tela e tradutores seguem o idioma escolhido
  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  }, [language]);

  // Dados atuais baseados no idioma
  const currentData = resumeData[language];

  return (
    <SettingsContext.Provider value={{ language, toggleLanguage, theme, toggleTheme, currentData }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);