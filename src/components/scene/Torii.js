'use client';
import ToriiGate, { useToriiMaterials } from './ToriiGate';
import { TORII } from './config';

// Torii em primeiro plano do hero: a câmera passa por baixo dele no primeiro scroll
export default function Torii() {
  const { body, top } = useToriiMaterials();
  return <ToriiGate spec={TORII} body={body} top={top} position={TORII.position} />;
}
