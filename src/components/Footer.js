'use client';
import { useSettings } from '../context/SettingsContext';
import { profile } from '../data/resume';

// Rodapé assinado com o hanko 奥山, como a última página de um emakimono
export default function Footer() {
  const { currentData } = useSettings();

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <span className="footer-hanko font-jp" aria-hidden="true">奥山</span>
        <div className="footer-text">
          <p className="footer-name">
            {profile.name} <span className="footer-kanji font-jp" lang="ja">{profile.nameKanji}</span>
          </p>
          <p className="footer-made">{currentData.footer.made}</p>
          <p className="footer-rights">
            © {new Date().getFullYear()} Raphael Okuyama. {currentData.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
