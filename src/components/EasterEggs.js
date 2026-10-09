'use client';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DOMAIN, typedSecret } from '../lib/domain';

// Segredos pesados carregados só quando alguém os chama: aqui ficam apenas os gatilhos (alguns
// ouvintes de evento). O código da bola d'água e do Vazio Infinito baixa no primeiro uso
const WaterCursor = dynamic(() => import('./WaterCursor'), { ssr: false });
const DomainExpansion = dynamic(() => import('./domain/DomainExpansion'), { ssr: false });
const BlackFlash = dynamic(() => import('./BlackFlash'), { ssr: false });

const HOLD_SELECTOR = '[data-station="stack"] .section-kanji';
const editable = (el) => Boolean(el?.closest?.('input, textarea, select, [contenteditable="true"]'));

export default function EasterEggs() {
  // Ponto onde a primeira gota nasce (o cursor no golpe da katana) e o gatilho do domínio
  const [water, setWater] = useState(null);
  const [domain, setDomain] = useState(null);
  const close = useCallback(() => setDomain(null), []);
  // 黒閃: o clarão do golpe certeiro na katana (no ponto do clique)
  const [flash, setFlash] = useState(null);
  const endFlash = useCallback(() => setFlash(null), []);

  useEffect(() => {
    const last = { x: -200, y: -200 };
    let buffer = '';
    let holdTimer = 0;
    let holding = null;
    let heldSince = 0;
    let heldAt = null;
    const onMove = (e) => {
      last.x = e.clientX;
      last.y = e.clientY;
    };
    // 水玉: o primeiro golpe carrega a bola; os seguintes ela mesma escuta
    const onSlash = () => setWater((w) => w ?? { x: last.x, y: last.y });
    const onBlackFlash = () => setFlash({ x: last.x, y: last.y, key: performance.now() });
    // 領域展開: palavra secreta (fora de campos) ou segurar o kanji 技
    const onKey = (e) => {
      if (editable(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const r = typedSecret(buffer, e.key);
      buffer = r.buffer;
      if (r.hit) {
        buffer = '';
        setDomain((d) => d ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    };
    const cancel = () => {
      clearTimeout(holdTimer);
      holding?.classList.remove('is-charging');
      holding = null;
    };
    // Soltou depois do tempo, mas o timer atrasou (a thread ocupada, por exemplo com a cena 3D
    // começando no primeiro toque): conta o tempo segurado de verdade e abre do mesmo jeito
    const onUp = () => {
      const held = holding && performance.now() - heldSince >= DOMAIN.hold;
      const at = heldAt;
      cancel();
      if (held) setDomain((d) => d ?? at);
    };
    const onDown = (e) => {
      const kanji = e.target?.closest?.(HOLD_SELECTOR);
      if (!kanji) return;
      holding = kanji;
      heldSince = performance.now();
      kanji.classList.add('is-charging');
      const { clientX: x, clientY: y } = e;
      heldAt = { x, y };
      // Já começa a baixar o domínio enquanto a pessoa segura
      import('./domain/DomainExpansion');
      holdTimer = setTimeout(() => {
        cancel();
        setDomain((d) => d ?? { x, y });
      }, DOMAIN.hold);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('katana-slash', onSlash);
    window.addEventListener('black-flash', onBlackFlash);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', cancel);
    return () => {
      cancel();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('katana-slash', onSlash);
      window.removeEventListener('black-flash', onBlackFlash);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', cancel);
    };
  }, []);

  return (
    <>
      {water ? <WaterCursor initial={water} /> : null}
      {domain ? <DomainExpansion origin={domain} onDone={close} /> : null}
      {flash ? <BlackFlash key={flash.key} x={flash.x} y={flash.y} onDone={endFlash} /> : null}
    </>
  );
}
