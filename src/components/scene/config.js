// Caminho da câmera: desce e avança para dentro da montanha (z negativo).
// Passa pelos vales das camadas (x ≈ 0).
export const CAMERA_PATH = [
  // Começa mais atrás: no hero o torii fica à distância, pequeno contra as montanhas
  [0, 8.5, 38],
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

// Torii do hero: fica no ponto do caminho em que o "Sobre" começa, então a câmera
// passa por baixo dele exatamente quando a seção entra. A base fica `baseDrop` abaixo
// da câmera (o nuki passa ~1 acima dela)
export const TORII = {
  pillarHeight: 10,
  pillarRadius: 0.35,
  span: 7,
  kasagiY: 9.6,
  nukiY: 8.0,
  baseDrop: 7,
  // Distância do portão ao início do caminho: no hero ele fica ao fundo, igual em qualquer tela
  toriiDistance: 26,
  // Momento da travessia dentro da faixa do "Sobre" (0 = começo, 1 = fim)
  anchor: 0.35,
  // Faixa padrão do "Sobre" até a seção medir a posição real
  fallbackRange: [0.1, 0.26],
};

// Sol (昼) / lua (夜) no céu, visível do começo do caminho
export const CELESTIAL = { position: [-14, 22, -90], radius: 4 };


// Jardim zen (枯山水) visto de cima durante o "Stack": areia rastelada + 9 pedras
export const GARDEN = {
  size: [22, 9],
  segments: { high: [176, 72], low: [1, 1] },
  groundDrop: 2.6,
  // Onde o jardim fica em relação à faixa do Stack (0 = começo, 1 = fim; > 1 = adiante).
  // Fica à frente da câmera para ser visto de cima enquanto o Stack está na tela
  anchor: 1.35,
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

// Momiji (紅葉) caindo em volta da câmera durante os Projetos (outono)
export const MOMIJI = {
  // Metade da caixa em volta do ponto da curva no meio da seção
  halfSize: [16, 7, 14],
  fallbackRange: [0.45, 0.72],
  size: [0.3, 0.3],
  countScale: 0.6,
};

// Neve (雪) da Experiência ao fim da jornada
export const SNOW = {
  halfSize: [16, 8, 24],
  fallbackStart: 0.72,
  size: [0.09, 0.09],
  countScale: 0.8,
};

// Rio escuro no fim do caminho, com lanternas (灯籠流し) descendo a correnteza
export const RIVER = {
  // Distância abaixo do fim da curva e tamanho (largura x comprimento)
  drop: 1.6,
  size: [12, 40],
  // A faixa começa um pouco depois do fim da câmera
  offsetZ: -16,
  fallbackStart: 0.88,
};

export const LANTERNS = {
  count: { high: 10, low: 5 },
  maxReleased: 8,
  // Faixa em z local do rio (a câmera fica do lado +z): as lanternas andam para -z, se afastando
  laneZ: [-12, 8],
  laneX: [-3.5, 3.5],
  speed: 0.35,
  // Intensidade da luz: > 1 dispara o bloom (só em qualidade alta)
  glow: { night: 3.4, day: 1.15 },
};

// 404 (迷子): névoa densa que engole o caminho
export const LOST_FOG = { range: [0.5, 11], skyMix: 0.75 };

// Voo da câmera ao entrar/sair de uma rota congelada (spec §3.4)
export const CAMERA_FLIGHT = { duration: 1.2 };
