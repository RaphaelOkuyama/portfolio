'use client';
import { useSettings } from '../context/SettingsContext';
import Particles from './Particles';

export default function BackgroundParticles() {
  const { theme } = useSettings();

  // CORES:
  // Se for Dark Mode: Partículas brancas (#ffffff)
  // Se for Light Mode: Partículas cinza escuro/preto (#000000)
  const particleColor = theme === 'dark' ? ['#ffffff'] : ['#000000'];

  return (
    <Particles
      particleColors={particleColor}
      particleCount={150}      // Quantidade (não exagere para não travar PC fraco)
      particleSpread={10}      // Espalhamento
      speed={0.1}              // Velocidade suave
      particleBaseSize={100}   // Tamanho base
      moveParticlesOnHover={true}
      alphaParticles={false}
      disableRotation={false}
      sizeRandomness={1}
      cameraDistance={20}
    />
  );
}