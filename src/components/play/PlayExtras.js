'use client';
import dynamic from 'next/dynamic';
import { useJourney } from '../../store/journey';
import { useSettings } from '../../context/SettingsContext';
import Pets from './Pets';

// O modo foto só baixa quando alguém liga
const PhotoMode = dynamic(() => import('./PhotoMode'), { ssr: false });

const STAGES = ['hero', 'about', 'stack', 'projects', 'experience', 'contato'];

// ファミコン: a moldura do modo de 8 bits. Linhas de varredura por cima de tudo e um placar de
// jogo: a fase é a seção em que a pessoa está e os pontos sobem com a rolagem
function RetroHud() {
  const section = useJourney((s) => s.section);
  const score = useJourney((s) => Math.round(s.progress * 100) * 100);
  const { language } = useSettings();
  const stage = Math.max(0, STAGES.indexOf(section)) + 1;
  return (
    <>
      <div className="retro-scan" aria-hidden="true" />
      <p className="retro-hud" data-retro-hud="" aria-hidden="true">
        <span>{language === 'en' ? 'STAGE' : 'FASE'} 1-{stage}</span>
        <span>{language === 'en' ? 'SCORE' : 'PONTOS'} {String(score).padStart(6, '0')}</span>
        <span className="retro-hud-blink">1P</span>
      </p>
    </>
  );
}

// 遊: o que os extras do menu põem na tela (bichinhos, moldura do Famicom, modo foto)
export default function PlayExtras() {
  const retro = useJourney((s) => s.retro);
  const photo = useJourney((s) => s.photo);
  return (
    <>
      <Pets />
      {retro ? <RetroHud /> : null}
      {photo ? <PhotoMode /> : null}
    </>
  );
}
