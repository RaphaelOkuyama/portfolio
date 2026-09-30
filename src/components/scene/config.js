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

// Torii em primeiro plano: a câmera passa por baixo do nuki no começo da jornada
// (em z = 14 a câmera está em y ≈ 6; o nuki fica em y = -1 + 8 = 7)
export const TORII = {
  position: [0, -1, 14],
  pillarHeight: 10,
  pillarRadius: 0.35,
  span: 7,
  kasagiY: 9.6,
  nukiY: 8.0,
};

// Sol (昼) / lua (夜) no céu, visível do começo do caminho
export const CELESTIAL = { position: [-14, 22, -90], radius: 4 };

// Senbon torii (千本鳥居): portões menores enfileirados no caminho da câmera durante o "Sobre".
// A base fica `baseDrop` abaixo da câmera: o nuki passa ~0,8 acima dela.
export const SENBON = {
  count: { high: 12, low: 6 },
  pillarHeight: 5.2,
  pillarRadius: 0.2,
  span: 3.6,
  kasagiY: 4.9,
  nukiY: 4.1,
  baseDrop: 3.3,
  // Faixa padrão (fração do progresso) até a seção medir a posição real
  fallbackRange: [0.13, 0.29],
};

// Jardim zen (枯山水) visto de cima durante o "Stack": areia rastelada + 9 pedras
export const GARDEN = {
  size: [22, 9],
  segments: { high: [176, 72], low: [1, 1] },
  groundDrop: 2.6,
  // Onde o jardim fica dentro da faixa do Stack (0 = começo, 1 = fim)
  anchor: 0.55,
  fallbackRange: [0.3, 0.55],
  stones: [
    { x: -7, z: -1, r: 0.9 },
    { x: -5.8, z: 0.6, r: 0.55 },
    { x: -6.3, z: -2.2, r: 0.45 },
    { x: 0.5, z: 1.2, r: 1.0 },
    { x: 1.8, z: -0.4, r: 0.6 },
    { x: -0.6, z: -1.4, r: 0.5 },
    { x: 6.5, z: 0.3, r: 0.85 },
    { x: 7.6, z: -1.5, r: 0.5 },
    { x: 5.4, z: -1.9, r: 0.6 },
  ],
  fireflyVolume: { x: [-11, 11], y: [0.3, 3], z: [-4.5, 4.5] },
};
