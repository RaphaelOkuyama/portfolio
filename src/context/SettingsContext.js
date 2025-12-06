'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { resumeData } from '../data/resume';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState('pt');
  const [theme, setTheme] = useState('dark');

  // Alternar Tema
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Alternar Idioma
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'pt' ? 'en' : 'pt'));
  };

  // Carregar preferência salva
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Dados atuais baseados no idioma
  const currentData = resumeData[language];

  return (
    <SettingsContext.Provider value={{ language, toggleLanguage, theme, toggleTheme, currentData }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);