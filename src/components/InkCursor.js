'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { pruneTrail, trailWidth } from '../lib/cursor/trail';

const DOT_SIZE = 10;
const TRAIL_MAX_WIDTH = 6;

function isInteractive(target) {
  return Boolean(target?.closest?.('a, button, input, textarea, select, [role="button"]'));
}

function readInk() {
  return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
}

// Ponto de tinta que segue o mouse, com rastro de pincel e crescimento sobre links
export default function InkCursor() {
  const [enabled, setEnabled] = useState(false);
  const [withTrail, setWithTrail] = useState(false);
  const dotRef = useRef(null);
  const canvasRef = useRef(null);

  // Só em mouse/trackpad; sem rastro com movimento reduzido
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine) and (min-width: 768px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setEnabled(fine.matches);
      setWithTrail(fine.matches && !reduced.matches);
    };
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
    const dot = dotRef.current;
    gsap.set(dot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const setX = gsap.quickSetter(dot, 'x', 'px');
    const setY = gsap.quickSetter(dot, 'y', 'px');
    let points = [];

    const onMove = (e) => {
      setX(e.clientX);
      setY(e.clientY);
      if (withTrail) points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    };
    const onOver = (e) => {
      const hover = isInteractive(e.target);
      dot.dataset.hover = String(hover);
      gsap.to(dot, { scale: hover ? 2.4 : 1, duration: 0.3, ease: 'power2.out', overwrite: true });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver);

    const cleanups = [
      () => window.removeEventListener('pointermove', onMove),
      () => window.removeEventListener('pointerover', onOver),
    ];

    const canvas = canvasRef.current;
    if (withTrail && canvas) {
      const ctx = canvas.getContext('2d');
      let ink = readInk();

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);

      // A cor da tinta acompanha o tema
      const observer = new MutationObserver(() => {
        ink = readInk();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      const draw = () => {
        points = pruneTrail(points, performance.now());
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (points.length < 2) return;
        ctx.strokeStyle = ink;
        ctx.lineCap = 'round';
        for (let i = 1; i < points.length; i++) {
          ctx.lineWidth = trailWidth(i, points.length, TRAIL_MAX_WIDTH);
          ctx.globalAlpha = 0.25 + 0.5 * (i / (points.length - 1));
          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      gsap.ticker.add(draw);

      cleanups.push(
        () => gsap.ticker.remove(draw),
        () => window.removeEventListener('resize', resize),
        () => observer.disconnect(),
      );
    }

    return () => cleanups.forEach((fn) => fn());
  }, [enabled, withTrail]);

  if (!enabled) return null;

  return (
    <>
      {withTrail ? (
        <canvas
          ref={canvasRef}
          data-cursor-trail=""
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }}
        />
      ) : null}
      <div
        ref={dotRef}
        data-cursor="ink"
        data-hover="false"
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, left: 0, width: DOT_SIZE, height: DOT_SIZE,
          borderRadius: '50%', background: 'var(--ink)', pointerEvents: 'none', zIndex: 9999,
        }}
      />
    </>
  );
}
