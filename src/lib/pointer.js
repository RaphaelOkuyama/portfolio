// Ponteiro em coordenadas normalizadas (-1..1, y para cima), lido pela cena sem re-render
export const pointer = { x: 0, y: 0, active: false };

export function toNdc(clientX, clientY, width, height) {
  return { x: (clientX / width) * 2 - 1, y: -((clientY / height) * 2 - 1) };
}

export function trackPointer() {
  const onMove = (e) => {
    const { x, y } = toNdc(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
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
