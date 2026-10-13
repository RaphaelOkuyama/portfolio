'use client';
import { useEffect } from 'react';
import { journeyStore } from '../../store/journey';
import { useThree } from '@react-three/fiber';

// Resolução da cena leve (WebGL na CPU, sem GPU). Pintar pixels é quase todo o custo do quadro
// (a geometria quase não pesa), então a resolução decide o fps:
//  · logo depois de a cena ficar pronta, desenha alguns quadros de teste e mede de verdade (ler um
//    pixel obriga a esperar o quadro terminar) e escolhe a maior fração que cabe no orçamento
//  · rolando, se os quadros seguidos passarem do tempo, baixa mais um degrau
// O navegador amplia o canvas: a imagem fica mais macia, mas a rolagem fica em 60 fps
export const LITE_DPR = { start: 0.5, min: 0.22, max: 0.75 };
// Tempo de um quadro no rasterizador por software (ms): sobra o resto dos 16 ms para a página
const BUDGET = 8;

function measure(gl, scene, camera, dpr, width, height) {
  const ctx = gl.getContext();
  const px = new Uint8Array(4);
  gl.setPixelRatio(dpr);
  gl.setSize(width, height, false);
  const frame = () => {
    gl.render(scene, camera);
    ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
  };
  frame();
  // O menor de algumas medidas: logo depois de a cena ficar pronta ainda há trabalho em volta
  let best = Infinity;
  for (let i = 0; i < 4; i += 1) {
    const t0 = performance.now();
    frame();
    best = Math.min(best, performance.now() - t0);
  }
  return best;
}

// `onDpr`: o Canvas recebe a resolução pela propriedade dpr (aplicar direto no renderizador seria
// desfeito na próxima renderização do Canvas)
export default function LiteTuner({ onDpr }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    // Espera a página sossegar (logo depois de pronta ainda há compilação e montagem em volta, e a
    // medida sairia pessimista demais)
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => {
      // Tamanho na tela (CSS): o canvas é ampliado até ele
      const { width, height } = gl.domElement.getBoundingClientRect();
      // O custo cresce com a área (dpr²): uma medida dá a estimativa, a segunda confere
      const at = LITE_DPR.start;
      let dpr = Math.min(LITE_DPR.max, Math.max(LITE_DPR.min, at * Math.sqrt(BUDGET / Math.max(0.5, measure(gl, scene, camera, at, width, height)))));
      if (measure(gl, scene, camera, dpr, width, height) > BUDGET * 1.25) dpr = Math.max(LITE_DPR.min, dpr * 0.85);
      gl.domElement.closest('[data-scene]')?.setAttribute('data-lite-dpr', dpr.toFixed(2));
      onDpr(dpr);
      invalidate();
    }, { timeout: 4000 });
    return () => cancel(id);
  }, [gl, scene, camera, onDpr, invalidate]);

  return null;
}

// Laço próprio da cena leve (o Canvas fica em frameloop "never"). Um quadro só quando algo mudou:
// a página rolou, o tema ou a estação trocou, ou a câmera ainda está chegando no lugar. Parada, a
// cena não custa nada. A rolagem da página vem primeiro: sem GPU o navegador compõe a tela inteira
// na CPU, e numa máquina fraca isso sozinho já come quase todo o quadro. Se a página atrasar:
//  1. a cena desenha a 30 por segundo
//  2. baixa a resolução (até o mínimo)
//  3. não desenha durante a rolagem: desliza até o lugar quando a pessoa para de rolar
export function LiteLoop({ onDpr }) {
  const advance = useThree((s) => s.advance);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    let dirty = 40;
    let raf = 0;
    let lastDraw = 0;
    let lastTick = 0;
    let cap = 0;
    let calm = 0;
    let stage = 0;
    let lastScroll = 0;
    const gaps = [];
    const seen = camera.matrixWorld.clone();
    // As transições de cor (tema, estação) levam quase um segundo: segue desenhando um pouco
    const wake = () => { dirty = Math.max(dirty, 40); };
    const unsubscribe = journeyStore.subscribe((st, prev) => {
      if (st.progress !== prev.progress) lastScroll = performance.now();
      wake();
    });
    window.addEventListener('resize', wake);
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      // Intervalo entre quadros da página enquanto a cena desenha: mede se a máquina dá conta
      if (lastTick && dirty && !stage) gaps.push(now - lastTick);
      lastTick = now;
      if (gaps.length >= 30) {
        const typical = gaps.sort((a, b) => a - b)[gaps.length >> 1];
        gaps.length = 0;
        const current = gl.getPixelRatio();
        const set = (value) => {
          gl.domElement.closest('[data-scene]')?.setAttribute('data-lite-dpr', value.toFixed(2));
          onDpr(value);
        };
        if (typical > 20) {
          calm = 0;
          if (!cap) cap = 1000 / 30;
          else if (current > LITE_DPR.min) set(Math.max(LITE_DPR.min, current * 0.85));
          else stage = 1;
        } else if (typical < 13 && !cap && current < LITE_DPR.max && (calm += 1) >= 3) {
          // Folga em três medidas seguidas: um degrau acima
          calm = 0;
          set(Math.min(LITE_DPR.max, current * 1.12));
        }
      }
      if (!dirty || document.hidden) return;
      // Máquina fraca: rolando, a cena espera (a câmera alcança quando a rolagem para)
      if (stage && now - lastScroll < 180) return;
      if (cap && now - lastDraw < cap - 2) return;
      lastDraw = now;
      advance(now);
      // A câmera ainda se mexeu neste quadro (amortecimento da rolagem): mais um
      if (!camera.matrixWorld.equals(seen)) {
        seen.copy(camera.matrixWorld);
        dirty = 2;
      } else dirty -= 1;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener('resize', wake);
    };
  }, [advance, camera, gl, onDpr]);
  return null;
}
