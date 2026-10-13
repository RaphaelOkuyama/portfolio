// Ponteiro em coordenadas normalizadas (-1..1, y para cima), lido pela cena sem re-render
export const pointer = { x: 0, y: 0, active: false };

export function toNdc(clientX, clientY, width, height) {
  return { x: (clientX / width) * 2 - 1, y: -((clientY / height) * 2 - 1) };
}

// Altura da cena: no celular ela é a tela com a barra recolhida (100lvh), maior que a janela
// enquanto a barra aparece. Os raios do cursor e dos cliques usam esta, não a da janela
export function sceneHeight() {
  return document.querySelector('[data-scene]')?.clientHeight || window.innerHeight;
}

export function trackPointer() {
  const onMove = (e) => {
    const { x, y } = toNdc(e.clientX, e.clientY, window.innerWidth, sceneHeight());
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  };
  const onLeave = () => {
    pointer.active = false;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
  };
}
