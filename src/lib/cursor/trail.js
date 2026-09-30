// Rastro de pincel do cursor: pontos recentes com timestamp
export const TRAIL_TTL_MS = 260;

export function pruneTrail(points, now, ttl = TRAIL_TTL_MS) {
  return points.filter((p) => now - p.t <= ttl);
}

// Fino no fim do rastro (15% da espessura), cheio perto do ponteiro
export function trailWidth(index, length, maxWidth) {
  if (length < 2) return maxWidth;
  return maxWidth * (0.15 + 0.85 * (index / (length - 1)));
}
