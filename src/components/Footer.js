'use client';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { currentData } = useSettings();
  
  return (
    <footer className="footer"> {/* Classe do CSS Global */}
      <p>
        © {new Date().getFullYear()} Raphael Okuyama.{' '}
        {/* A classe 'footer-break' força a quebra de linha abaixo de 425px */}
        <span className="footer-break">
          {currentData.footer.rights}
        </span>
      </p>
    </footer>
  );
}