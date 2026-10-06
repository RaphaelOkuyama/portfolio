'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  WATER, createBall, gather, kick, lensMap, shapeMatrix, spray, stepBall, stepDrops,
} from '../lib/cursor/waterBall';
import { createDrop, inverseShape } from './water/dropShader';

// 水玉: depois do golpe da katana o pontinho de tinta some e o cursor vira uma gota d'água de
// verdade: uma lente que refrata a própria página por trás dela (backdrop-filter com o mapa de
// deslocamento de lensMap, separado em R, G e B para a borda pegar um arco-íris), com espessura
// (sombras internas), reflexo de janela, cáustica, sombra projetada com a luz focada no meio e
// forma de gelatina (física em lib/cursor/waterBall). Cada clique espirra gotas e a deixa menor;
// pequena demais, ou depois de WATER.life segundos, ela estoura e o pontinho de tinta volta.
// Navegadores sem filtro SVG no backdrop caem num desfoque com saturação (ainda parece vidro)

const S = WATER.size;
// O canvas 3D tem o dobro do diâmetro: sobra lugar para a gota esticar e tremer
const L = S * 2;
const isInteractive = (el) => Boolean(el?.closest?.('a, button, input, textarea, select, [role="button"]'));

// Borda orgânica: os oito raios do border-radius oscilam um pouco (mais quando ela corre)
function organicRadius(t, amp) {
  const v = (i) => 50 + amp * Math.sin(t * (2.1 + i * 0.37) + i * 1.9);
  return `${v(0)}% ${v(1)}% ${v(2)}% ${v(3)}% / ${v(4)}% ${v(5)}% ${v(6)}% ${v(7)}%`;
}

export default function WaterCursor({ initial = null }) {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef(null);
  const ballRef = useRef(null);
  const shadowRef = useRef(null);
  const glRef = useRef(null);

  // Mapa da lente (uma vez): vira um PNG para o feImage do filtro
  const map = useMemo(() => {
    if (typeof document === 'undefined') return '';
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    c.getContext('2d').putImageData(new ImageData(lensMap(size), size, size), 0, 0);
    return c.toDataURL();
  }, []);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine) and (min-width: 768px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setEnabled(fine.matches && !reduced.matches);
    apply();
    fine.addEventListener('change', apply);
    reduced.addEventListener('change', apply);
    return () => {
      fine.removeEventListener('change', apply);
      reduced.removeEventListener('change', apply);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const canvas = canvasRef.current;
    const el = ballRef.current;
    const shadow = shadowRef.current;
    const glCanvas = glRef.current;
    const ctx = canvas.getContext('2d');
    const glDpr = Math.min(window.devicePixelRatio || 1, 2);
    glCanvas.width = Math.round(L * glDpr);
    glCanvas.height = Math.round(L * glDpr);
    const drop3d = createDrop(glCanvas);
    // Sem WebGL: fica a lente com o brilho de CSS (classe no-gl)
    if (!drop3d) el.classList.add('no-gl');
    const root = document.documentElement;
    const mouse = { x: -200, y: -200 };
    let ball = null;
    let drops = [];
    let rings = [];
    let hover = 1;
    let hoverTarget = 1;
    let start = 0;
    let burstAt = 0;
    let raf = 0;
    let last = 0;
    let size = { w: 0, h: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { w: canvas.clientWidth, h: canvas.clientHeight };
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onOver = (e) => {
      hoverTarget = isInteractive(e.target) ? 1.35 : 1;
    };

    const hide = () => {
      el.classList.remove('is-on');
      shadow.classList.remove('is-on');
      glCanvas.classList.remove('is-on');
    };

    const burst = (now) => {
      if (!ball || burstAt) return;
      burstAt = now;
      drops.push(...spray(ball, 42, { speed: 460, spread: 1.3, size: [1.8, 5.5] }));
      rings.push({ x: ball.x, y: ball.y, age: 0 });
      setTimeout(() => root.removeAttribute('data-cursor-mode'), 320);
    };

    const onDown = () => {
      if (!ball || burstAt) return;
      drops.push(...spray(ball, 10, { speed: 340 }));
      rings.push({ x: ball.x, y: ball.y, age: 0, small: true });
      kick(ball, 9);
      ball.size *= WATER.splashShrink;
      if (ball.size < WATER.burstAt) burst(performance.now() / 1000);
    };

    // Gotas como pequenas esferas: borda azul, miolo claro, brilho de um lado e sombra do outro
    const drawDrop = (d) => {
      const r = d.size;
      const g = ctx.createRadialGradient(d.x - r * 0.35, d.y - r * 0.4, r * 0.05, d.x, d.y, r);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      g.addColorStop(0.35, 'rgba(190, 228, 255, 0.55)');
      g.addColorStop(0.85, 'rgba(70, 140, 220, 0.55)');
      g.addColorStop(1, 'rgba(30, 80, 160, 0.7)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, size.w, size.h);
      // Anéis de respingo: uma onda clara abrindo e sumindo
      rings.forEach((g) => {
        const k = g.age / (g.small ? 0.45 : 0.7);
        const r = (g.small ? 26 : 44) + k * (g.small ? 30 : 70);
        // Onda de choque fina: clara por fora e sumindo enquanto abre
        const fade = (1 - k) ** 2;
        ctx.lineWidth = 0.6 + (1 - k) * 1.4;
        ctx.strokeStyle = `rgba(220, 242, 255, ${0.42 * fade})`;
        ctx.beginPath();
        ctx.arc(g.x, g.y, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      drops.forEach((d) => {
        const life = d.life ?? WATER.dropLife;
        ctx.globalAlpha = d.gathering ? Math.min(1, d.age / 0.08) * (1 - (d.age / life) ** 4) : Math.max(0, 1 - (d.age / life) ** 2);
        drawDrop(d);
      });
      ctx.globalAlpha = 1;
    };

    const tick = (now) => {
      const t = now / 1000;
      const dt = Math.min(1 / 30, last ? t - last : 1 / 60);
      last = t;
      hover += (hoverTarget - hover) * (1 - Math.exp(-dt * 10));

      if (ball) {
        const age = t - start;
        stepBall(ball, mouse, dt);
        // Entrada elástica: cresce do nada e passa um pouco do tamanho
        const pop = age < 0.9 ? 1 - Math.cos(age * 10) * Math.exp(-age * 6.5) : 1;
        let scale = Math.max(0.01, pop) * ball.size * hover;
        let opacity = 1;
        if (burstAt) {
          const k = (t - burstAt) / 0.18;
          scale *= 1 + k * 0.6;
          opacity = Math.max(0, 1 - k);
          if (k >= 1) {
            ball = null;
            burstAt = 0;
            hide();
          }
        }
        if (ball) {
          const [a, b, c, d] = shapeMatrix(ball);
          const speed = Math.hypot(ball.vx, ball.vy);
          el.style.transform = `translate3d(${ball.x - S / 2}px, ${ball.y - S / 2}px, 0) matrix(${a}, ${b}, ${c}, ${d}, 0, 0) scale(${scale})`;
          el.style.borderRadius = organicRadius(t, 2.5 + Math.min(7, speed / 220));
          el.style.opacity = String(opacity);
          // Sombra: abaixo e à direita (a luz vem de cima, à esquerda), mais longe quando ela corre
          shadow.style.transform = `translate3d(${ball.x - S / 2 + 5}px, ${ball.y - S / 2 + 15 + Math.min(8, speed / 300)}px, 0) matrix(${a}, ${b}, ${c}, ${d}, 0, 0) scale(${scale * 1.05})`;
          shadow.style.opacity = String(opacity);
          if (drop3d) {
            // Mesma posição e escala da lente; a forma (alongar, tremer) é feita no shader
            glCanvas.style.transform = `translate3d(${ball.x - L / 2}px, ${ball.y - L / 2}px, 0) scale(${scale})`;
            glCanvas.style.opacity = String(opacity);
            const jiggle = Math.min(1, Math.abs(ball.sv) * 0.35 + Math.abs(ball.squashV) * 0.06 + speed / 2600);
            drop3d.draw({ time: t, inv: inverseShape([a, b, c, d]), jiggle });
          }
          // Correndo: pinga
          if (!burstAt && speed > WATER.dripSpeed && Math.random() < dt * 12) {
            drops.push(...spray(ball, 1, { speed: 50, inherit: 0.15, size: [1.4, 2.8] }));
            ball.size *= 0.997;
          }
          if (!burstAt && (age > WATER.life || ball.size < WATER.burstAt)) burst(t);
        }
      }

      drops = stepDrops(drops, dt);
      rings = rings.filter((g) => {
        g.age += dt;
        return g.age < (g.small ? 0.45 : 0.7);
      });
      draw();
      if (ball || drops.length || rings.length) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        last = 0;
        ctx.clearRect(0, 0, size.w, size.h);
      }
    };

    // O golpe da katana (KatanaSlash): a bola se forma no cursor, ou enche de novo se já existe
    const onSlash = () => {
      start = performance.now() / 1000;
      burstAt = 0;
      if (ball) {
        ball.size = 1;
        kick(ball, 8);
      } else {
        ball = createBall(mouse.x, mouse.y);
        drops.push(...gather(mouse.x, mouse.y, 16));
      }
      el.classList.add('is-on');
      shadow.classList.add('is-on');
      glCanvas.classList.add('is-on');
      root.setAttribute('data-cursor-mode', 'water');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('katana-slash', onSlash);
    // Carregada pelo primeiro golpe (EasterEggs): já nasce no ponto em que ele aconteceu
    if (initial) {
      mouse.x = initial.x;
      mouse.y = initial.y;
      onSlash();
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('katana-slash', onSlash);
      observer.disconnect();
      cancelAnimationFrame(raf);
      drop3d?.dispose();
      root.removeAttribute('data-cursor-mode');
    };
  }, [enabled, initial]);

  if (!enabled) return null;
  return (
    <>
      {/* Lente: o mapa desloca o fundo; três passadas com forças diferentes separam R, G e B */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <filter id="water-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage href={map} x="0" y="0" width={S} height={S} preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={S * 0.95} xChannelSelector="R" yChannelSelector="G" result="dr" />
          <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={S * 0.86} xChannelSelector="R" yChannelSelector="G" result="dg" />
          <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={S * 0.77} xChannelSelector="R" yChannelSelector="G" result="db" />
          <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </svg>
      <div ref={shadowRef} className="water-shadow" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10004 }}
      />
      <div ref={ballRef} className="water-ball" data-cursor="water" aria-hidden="true">
        <span className="water-ball-rim" />
      </div>
      <canvas ref={glRef} className="water-gl" aria-hidden="true" style={{ width: L, height: L }} />
    </>
  );
}
