// Caminho da câmera: desce e avança para dentro da montanha (z negativo).
// Passa pelos vales das camadas (x ≈ 0).
export const CAMERA_PATH = [
  [0, 7, 24],
  [0, 5.5, 8],
  [-1.5, 4.2, -8],
  [1.5, 3.2, -24],
  [-1, 2.4, -40],
  [1, 1.8, -56],
  [0, 1.4, -72],
];

// Névoa: começa perto, fecha antes das camadas mais distantes
export const FOG_RANGE = [10, 70];

// Camadas de montanha espalhadas ao longo do caminho, com vale central para a câmera passar
export const MOUNTAIN_LAYERS = Array.from({ length: 9 }, (_, i) => ({
  seed: 101 + i * 37,
  x: 0,
  z: 4 - i * 11,
  width: 160,
  segments: 160,
  baseHeight: -1 + (i % 3) * 0.6,
  amplitude: 7 + (i % 3) * 2.5,
  valleyCenter: 0,
  valleyDepth: 0.8,
  valleyWidth: 18,
  bottom: -30,
}));
