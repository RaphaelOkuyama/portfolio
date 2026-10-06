'use client';
import { useEffect, useRef, useState } from 'react';
import {
  WATER, createBall, outline, slosh, spray, stepBall, stepDrops,
} from '../lib/cursor/waterBall';

// 水玉: depois do golpe da katana o pontinho de tinta some e o cursor vira uma bola d'água (física
// em lib/cursor/waterBall). Ela estica ao correr, balança ao parar, pinga quando o mouse voa e cada
// clique espirra gotas e a deixa menor. Pequena demais, ou depois de WATER.life segundos, ela
// estoura num respingo e o pontinho de tinta volta. Só com mouse e sem movimento reduzido

const isInteractive = (el) => Boolean(el?.closest?.('a, button, input, textarea, select, [role="button"]'));

export default function WaterCursor() {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef(null);

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
    const ctx = canvas.getContext('2d');
    const root = document.documentElement;
    const mouse = { x: -100, y: -100 };
    let ball = null;
    let drops = [];
    let hover = 1;
    let hoverTarget = 1;
    let start = 0;
    let bursting = false;
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
      hoverTarget = isInteractive(e.target) ? 1.45 : 1;
    };

    const burst = () => {
      if (!ball || bursting) return;
      bursting = true;
      drops.push(...spray(ball, 34, { speed: 420, spread: 1.2, size: [2, 5.5] }));
      ball = null;
      // O pontinho de tinta volta assim que o respingo começa a cair
      setTimeout(() => {
        root.removeAttribute('data-cursor-mode');
        bursting = false;
      }, 380);
    };

    const onDown = () => {
      if (!ball) return;
      drops.push(...spray(ball, 9, { speed: 330 }));
      slosh(ball, 260);
      ball.size *= WATER.splashShrink;
      if (ball.size < WATER.burstAt) burst();
    };

    const draw = () => {
      ctx.clearRect(0, 0, size.w, size.h);
      // Gotas soltas: azul claro com um brilho
      drops.forEach((d) => {
        const fade = 1 - d.age / WATER.dropLife;
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = 'rgba(120, 190, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(d.x - d.size * 0.3, d.y - d.size * 0.3, d.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (!ball) return;

      const pts = outline(ball);
      const n = pts.length;
      // Contorno liso: curvas pelos pontos médios entre nós vizinhos
      const path = new Path2D();
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const m0 = mid(pts[n - 1], pts[0]);
      path.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i += 1) {
        const m = mid(pts[i], pts[(i + 1) % n]);
        path.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      path.closePath();

      const r = WATER.radius * ball.size * hover;
      // Corpo: transparente no meio, mais azul na borda (a água "engrossa" de lado)
      const body = ctx.createRadialGradient(ball.x + r * 0.2, ball.y + r * 0.25, r * 0.1, ball.x, ball.y, r * 1.25);
      body.addColorStop(0, 'rgba(190, 230, 255, 0.16)');
      body.addColorStop(0.6, 'rgba(110, 180, 255, 0.3)');
      body.addColorStop(1, 'rgba(40, 120, 220, 0.62)');
      ctx.fillStyle = body;
      ctx.fill(path);
      // Borda: linha fina clara por fora, sombra azul por dentro
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(215, 240, 255, 0.85)';
      ctx.stroke(path);
      ctx.save();
      ctx.clip(path);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(30, 90, 180, 0.28)';
      ctx.stroke(path);
      // Luz que atravessa a gota e junta embaixo (cáustica)
      const caustic = ctx.createRadialGradient(ball.x + r * 0.25, ball.y + r * 0.55, 0, ball.x + r * 0.25, ball.y + r * 0.55, r * 0.6);
      caustic.addColorStop(0, 'rgba(230, 250, 255, 0.55)');
      caustic.addColorStop(1, 'rgba(230, 250, 255, 0)');
      ctx.fillStyle = caustic;
      ctx.fillRect(ball.x - r * 2, ball.y - r * 2, r * 4, r * 4);
      ctx.restore();
      // Brilho principal (janela refletida) e um ponto pequeno do outro lado
      ctx.save();
      ctx.translate(ball.x - r * 0.36, ball.y - r * 0.42);
      ctx.rotate(-0.6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.32, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(ball.x + r * 0.42, ball.y + r * 0.38, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = (now) => {
      const t = now / 1000;
      const dt = Math.min(1 / 30, last ? t - last : 1 / 60);
      last = t;
      hover += (hoverTarget - hover) * (1 - Math.exp(-dt * 10));
      if (ball) {
        // Entrada elástica: cresce do nada passando um pouco do tamanho
        const age = t - start;
        const pop = age < 0.7 ? 1 - Math.cos(age * 9) * Math.exp(-age * 7) : 1;
        stepBall(ball, mouse, dt, { grow: Math.max(0.05, pop) * hover, time: t });
        // Correndo: pinga do lado de trás
        const speed = Math.hypot(ball.vx, ball.vy);
        if (speed > WATER.dripSpeed && Math.random() < dt * 14) {
          drops.push(...spray(ball, 1, { speed: 60, inherit: 0.2, size: [1.5, 3] }));
          ball.size *= 0.997;
        }
        if (age > WATER.life || ball.size < WATER.burstAt) burst();
      }
      drops = stepDrops(drops, dt);
      draw();
      if (ball || drops.length) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        last = 0;
        ctx.clearRect(0, 0, size.w, size.h);
      }
    };

    // O golpe da katana (KatanaSlash) chama: a bola nasce no cursor, ou enche de novo se já existe
    const onSlash = () => {
      start = performance.now() / 1000;
      if (ball) {
        ball.size = 1;
        slosh(ball, 300);
      } else {
        ball = createBall(mouse.x, mouse.y);
        slosh(ball, 200);
      }
      root.setAttribute('data-cursor-mode', 'water');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('katana-slash', onSlash);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('katana-slash', onSlash);
      observer.disconnect();
      cancelAnimationFrame(raf);
      root.removeAttribute('data-cursor-mode');
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      data-cursor="water"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10003 }}
    />
  );
}
