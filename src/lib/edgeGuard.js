'use client';
import { useEffect } from 'react';

// 縁 (borda): as peças fixas nas bordas da tela (o trilho de seções, a barra social, a linha de
// leitura dos projetos) e as áreas de largura total que passam por baixo delas (o rolo do
// emakimono, o rodapé). Quando uma área cobre a peça, a peça some (data-covered, ver o CSS) e volta
// quando a área passa: nenhum texto fica por baixo da navegação.
// Sem conta na rolagem: um IntersectionObserver por peça, com a raiz encolhida (rootMargin
// negativo) até a caixa da própria peça. O resto do conteúdo fica livre delas pela margem lateral
// do container (--edge-clear, no CSS)

const guards = new Set();
const pieces = new Map();

// Folga em volta da peça: a área começa a escondê-la antes de encostar (o esmaecer dura 0.3s e a
// página continua andando nesse tempo)
const PAD = 48;

function sync(piece) {
  piece.el.toggleAttribute('data-covered', piece.hits.size > 0);
}

function build(piece) {
  piece.io?.disconnect();
  piece.io = null;
  piece.hits.clear();
  // Escondida (display: none na largura atual): nada a observar
  const r = piece.el.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const inset = (gap) => `${-Math.max(0, Math.floor(gap - PAD))}px`;
    const rootMargin = `${inset(r.top)} ${inset(vw - r.right)} ${inset(vh - r.bottom)} ${inset(r.left)}`;
    piece.io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) piece.hits.add(entry.target);
        else piece.hits.delete(entry.target);
      }
      sync(piece);
    }, { rootMargin });
    guards.forEach((g) => piece.io.observe(g));
  }
  sync(piece);
}

// Peças centradas na altura da tela (o trilho) mudam de lugar quando a janela muda de tamanho
let frame = 0;
function onResize() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => pieces.forEach(build));
}

export function watchPiece(el) {
  const piece = { el, io: null, hits: new Set(), ro: null };
  pieces.set(el, piece);
  if (pieces.size === 1) window.addEventListener('resize', onResize);
  // Também dispara na primeira medida e quando a peça aparece ou some pelo media query
  piece.ro = new ResizeObserver(() => build(piece));
  piece.ro.observe(el);
  return () => {
    piece.ro.disconnect();
    piece.io?.disconnect();
    el.removeAttribute('data-covered');
    pieces.delete(el);
    if (pieces.size === 0) window.removeEventListener('resize', onResize);
  };
}

export function watchGuard(el) {
  guards.add(el);
  pieces.forEach((piece) => piece.io?.observe(el));
  return () => {
    guards.delete(el);
    pieces.forEach((piece) => {
      piece.io?.unobserve(el);
      if (piece.hits.delete(el)) sync(piece);
    });
  };
}

// Peça fixa da borda (some quando uma área de largura total passa por baixo)
export function useEdgePiece(ref) {
  useEffect(() => (ref.current ? watchPiece(ref.current) : undefined), [ref]);
}

// Área de largura total que esconde as peças fixas por onde passa
export function useEdgeGuard(ref) {
  useEffect(() => (ref.current ? watchGuard(ref.current) : undefined), [ref]);
}
