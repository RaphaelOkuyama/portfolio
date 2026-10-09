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

// Camadas de montanha espalhadas ao longo do caminho, com vale central para a câmera passar.
// Param antes do rio (margem de perto em z = -52): uma 7ª camada em z = -62 cortava a água
// com uma faixa de terra (água, terra, água). Atrás do rio, uma cordilheira distante
const GARDEN_CLEARING = {
  layers: [1, 2], // z = -7 e z = -18
  valley: { valleyDepth: 1, valleyWidth: 30, baseHeight: -0.6 },
};

// A camada da margem (z = -51) fica entre a câmera e o trecho do caminho que vira à esquerda
// rumo à ponte: com o vale centrado no meio a encosta engolia as lajes (o caminho "sumia" no fim
// dos Projetos). Aqui o vale desce abaixo do chão e se abre para a esquerda, sem sugi na faixa
const RIVERBANK_OPENING = {
  layer: 5,
  valley: { valleyCenter: -6, valleyDepth: 1, valleyWidth: 16, baseHeight: -1.2 },
  forestValleyHalf: 17,
};

const PATH_LAYERS = Array.from({ length: 6 }, (_, i) => ({
  seed: 101 + i * 37,
  x: 0,
  z: 4 - i * 11,
  width: 160,
  segments: 160,
  baseHeight: -1 + (i % 3) * 0.6,
  amplitude: 7 + (i % 3) * 2.5,
  valleyCenter: 0,
  // Vale quase até a base: com 0.8 sobrava uma lombada no meio que cortava o jardim do Stack
  valleyDepth: 0.95,
  valleyWidth: 18,
  bottom: -30,
  // As camadas que abraçam o jardim zen abrem uma clareira: vale mais largo e com o fundo
  // abaixo do chão, para nenhuma encosta passar na frente da areia (tests/unit/garden-occlusion)
  ...(GARDEN_CLEARING.layers.includes(i) ? GARDEN_CLEARING.valley : {}),
  ...(i === RIVERBANK_OPENING.layer ? { ...RIVERBANK_OPENING.valley, forestValleyHalf: RIVERBANK_OPENING.forestValleyHalf } : {}),
}));

const FAR_RANGE = [
  { seed: 911, z: -120, amplitude: 15, baseHeight: -3 },
  { seed: 947, z: -142, amplitude: 22, baseHeight: -4 },
].map((l) => ({ ...l, x: 0, width: 280, segments: 200, valleyCenter: 0, valleyDepth: 0.35, valleyWidth: 30, bottom: -40 }));

export const MOUNTAIN_LAYERS = [...PATH_LAYERS, ...FAR_RANGE];

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

// 磐座: a rocha sagrada ao lado do torii. offset = [à direita do caminho, atrás do portão] em
// unidades da cena; turn gira a frente (com a corda e os papéis) para o começo do caminho
// minAspect: abaixo dessa proporção (celular em pé) a pedra não aparece
export const IWAKURA = { offset: [10.5, 2.5], scale: 2.25, sink: 0.55, turn: -0.35, minAspect: 0.75 };

// 狛犬: o par de guardiões nos pés do torii, um de cada lado, um pouco à frente do portão e
// virados para dentro do caminho (para quem chega)
export const KOMAINU = { right: 5.3, ahead: -1.6, scale: 1.25, turnIn: 0.45 };

// 石灯籠: lanternas de pedra ladeando a trilha depois do torii (pulam o jardim zen, em z -21 a -8).
// Acendem à noite; `glow` > 1 dispara o bloom na qualidade alta
export const STONE_LANTERNS = { x: 7.4, z: [5, -2.5, -26, -33.5, -41], scale: 1.15, glow: { night: 2.3, day: 1 } };

// 竹林: bambuzal dos dois lados entre o torii e o jardim
export const BAMBOO = {
  // Afastados do centro e mais baixos: no hero ficam nas bordas, sem competir com o nome
  groves: [{ x: [-20, -11], z: [-1, -7.5] }, { x: [11, 20], z: [-1, -7.5] }],
  count: { high: 44, medium: 32, low: 22 },
  height: [7, 11.5],
  sway: 0.035,
};

// 木霊探し: cinco kodama escondidos pela jornada (atrás do bonsai, junto do shishi-odoshi, espiando
// atrás dos caixotes da barraca de máscaras, do outro lado das lanternas e no meio do bambuzal da
// direita). Longe da katana, para o clique de um não acertar o outro. Achar os cinco acende a
// floresta dos espíritos. [x, z, giro]
export const KODAMA_HUNT = {
  spots: [[9.7, -31.6, -0.6], [-10.9, -10.2, 0.7], [-8.4, 3.9, 1.1], [-8.9, -41.6, 0.9], [13.2, -5.0, -0.5]],
  scale: 0.8,
  // Raio mínimo do alvo na tela (px): pequeno de ver, fácil de tocar
  minHit: 18,
  spirits: 170,
};

// 鹿威し no canto do jardim zen, fora da moldura de areia
// 盆栽: o pinheiro na mesinha, à direita do caminho entre as lanternas de pedra
export const BONSAI = { x: 8.2, z: -30.2, rotY: -0.45, scale: 2.2 };

export const SHISHI_ODOSHI = { x: -9.5, z: -8.6, rotY: 0.9, scale: 1.4, cycle: 5.5 };

// 五重塔 na outra margem do rio, no alto do barranco: o destino da jornada, do outro lado da ponte
// e virado para ela
export const PAGODA = { x: 26, z: -118, scale: 1.5, rotY: -0.55 };

// 太鼓橋: ponte em arco de margem a margem, com as lanternas passando embaixo. Arco alto, como as
// taikobashi de verdade (a ponte "tambor")
export const TAIKOBASHI = { z: -96, span: 34, rise: 5.5, width: 3.6 };

// Beira do rio: 雁木 (gangi), a escadaria de pedra que desce da margem esquerda até a água (de
// onde as lanternas partem), e as lanternas de pedra nas cabeceiras da ponte
export const RIVERSIDE = {
  gangi: { z: [-84, -90.5], x: [-21.5, -12.2], steps: 13 },
  lanterns: [[-19.6, -92.6], [-19.6, -99.4], [19.6, -92.6], [19.6, -99.4]],
};

// 祭り: barraca de máscaras (お面屋) à esquerda do caminho, logo depois do torii e entre as
// lanternas de pedra, e leques (扇子) expostos ao lado da katana. rotY gira a frente (+z) de cada peça
export const FESTIVAL = {
  stall: { x: -6.7, z: 1.2, rotY: Math.PI / 2, scale: 1.1 },
  fans: { x: 17.2, z: -81.6, rotY: -0.85, scale: 1.4 },
};


// 刀掛け: o par de espadas (大小) num suporte na margem direita do rio, virado para quem desce
// o vale. Aparece na Experiência, do lado oposto ao caminho e aos cartões
export const KATANA = { x: 14.8, z: -80, rotY: -0.7, scale: 2.6 };

// 参道 (sandō): o caminho de pedra do começo da montanha até o pagode. Passa sob o torii, contorna
// o jardim zen pela direita, desce até a margem, segue pela beira do rio até a ponte e, do outro
// lado, sobe até o pagode. Pontos [x, z]; a altura vem do chão
export const SANDO = {
  width: 2.3,
  step: 0.95,
  points: [
    [0, 33], [0, 20], [0, 12], [0, 2], [0.4, -5], [5, -7.1], [10.9, -8.4], [11.1, -12.5],
    [11.1, -19.4], [8, -22.7], [0.6, -27], [0, -35], [-1.5, -42], [-9, -47], [-15, -50.4], [-17, -56], [-17.2, -70],
    [-17.4, -84], [-17.2, -92], [-16.6, -96],
  ],
  // Do outro lado da ponte até a escadaria do pagode
  farPoints: [[16.6, -96], [18.5, -102], [22.5, -109], [25.2, -113.5]],
};

// Sol (昼) / lua (夜) no céu, visível do começo do caminho
export const CELESTIAL = { position: [-14, 22, -90], radius: 4 };


// Chão do vale (地): terreno sob o caminho, do começo até a margem do rio (z = -52).
// O torii pousa nele em z ~ 12 (base a 7 abaixo da câmera) e o jardim zen fica no trecho
// plano em z ~ -6 a -18; perto do rio ele desce abaixo da água para a margem não aparecer
export const GROUND = {
  profile: [
    [46, -1.15],
    [12, -1.13],
    [0, -0.55],
    [-6, 0.75],
    [-21, 0.8],
    [-30, 0.35],
    [-44, 0.05],
    [-50, -0.45],
    [-56, -0.5],
  ],
  // Faixa plana no meio do vale e subida em concha nas laterais. Depois da margem o chão segue
  // por baixo do rio: no meio fica sob a água e nas laterais sobe e vira as duas margens (a
  // água aparece entre |x| ≈ 14), onde ficam a escadaria, a ponte e o pagode
  flatHalf: 10,
  bowl: 0.02,
  bowlMax: 5,
  // Até logo atrás do pagode (z = -132): mais longe a névoa já fecha, e cada metro de chão a
  // mais é shader de ruído por pixel pago à toa
  size: [140, 178],
  center: [0, -43],
  segments: [96, 160],
};

// Clareira do Stack, no meio das camadas z = -7 e z = -18 (antes era o jardim zen de areia). O
// caminho de pedra contorna ela pela direita; os vaga-lumes voam em volta à noite. size: a área
// livre (largura x profundidade), que o caminho não pisa
export const GARDEN = {
  size: [16, 9],
  // Posição fixa no mundo (no celular a seção é bem mais alta e a faixa medida ia para fora)
  z: -14.5,
  fallbackRange: [0.3, 0.55],
  fireflyVolume: { x: [-11, 11], y: [0.3, 4.5], z: [-4.5, 4.5] },
};

// 七夕: dois bambus de Tanabata, um de cada lado do caminho na clareira, com as tiras de papel
// (短冊), uma por ferramenta do Stack, nas cores das áreas. Uma corda liga as copas por cima do
// caminho, com três 吹き流し (bolas com serpentinas). sway: balanço das tiras (rad), que cresce com
// o vento do scroll; a área escolhida no Stack balança mais e brilha
export const TANABATA = {
  bamboos: [{ x: -3.9, z: -15.2, side: -1 }, { x: 3.9, z: -14.8, side: 1 }],
  height: 9.5,
  strip: [0.17, 0.52],
  sway: 0.13,
  active: { sway: 1.9, scale: 1.12, bright: 1.18, dim: 0.72 },
  rope: 8.1,
  streamers: [-1.6, 0, 1.6],
  streamerLength: 2.3,
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
  // Distância abaixo do fim da curva e tamanho (largura x comprimento): some na névoa ao fundo
  drop: 1.6,
  // Comprido o bastante para a margem de perto ficar atrás da câmera: com o respiro embaixo do
  // contato, a parte de baixo da tela mostra a água logo à frente, nunca o céu por baixo do rio
  size: [44, 152],
  // Centro do rio adiante do fim da câmera (as faixas das lanternas são relativas a ele)
  offsetZ: -56,
  fallbackStart: 0.88,
  // Reflexo do céu cresce com a distância (ângulo rasante)
  skyReflection: { night: 0.55, day: 0.6 },
};

// 鯉: carpas no rio do contato, nas coordenadas do rio (x lateral, z ao longo; a câmera fica em
// z = LANTERNS.viewZ). Nadam na faixa de água visível abaixo do conteúdo, vêm até o cursor quando
// ele passa sobre a água e acompanham a lanterna solta pelo formulário
export const KOI = {
  school: [
    { variant: 'kohaku', tint: '#fbf7ef', size: 1.6 },
    { variant: 'showa', tint: '#f6f0e4', size: 1.45 },
    { variant: 'plain', tint: '#e8a83a', size: 1.5 }, // 黄金 ogon
    { variant: 'tancho', tint: '#fbf8f2', size: 1.3 }, // 丹頂: só o círculo vermelho na cabeça
    { variant: 'plain', tint: '#d9dee6', size: 1.35 }, // プラチナ platina
    { variant: 'kohaku', tint: '#fbf7ef', size: 1.7 },
    { variant: 'showa', tint: '#f6f0e4', size: 1.25 },
  ],
  // Perto da câmera (que fica em z ≈ 56–61 no contato): a faixa de água que aparece embaixo do
  // conteúdo e no vão até o rodapé
  zone: { x: [-4.5, 4.5], z: [41, 56.5] },
  // Cursor um pouco fora da zona ainda atrai: elas vão até a borda mais próxima
  lureMargin: 4,
  // Abaixo da superfície (o shader mistura a cor com a da água e passa as marolas por cima)
  y: -0.16,
  speed: [0.45, 0.85],
  // Multiplicador da velocidade quando vão atrás do cursor ou da lanterna
  dash: 1.8,
  turn: 1.5,
  slowRadius: 1.2,
  spacing: 1.3,
  // Quantas vêm até o cursor e o raio da roda em volta dele (e da lanterna)
  curious: 4,
  orbit: { pointer: 1.2, lantern: 1.6 },
  followLantern: 14,
  // Mergulho: mistura com a cor da água; à noite as cores apagam um pouco
  submerge: 0.42,
  brightness: { night: 0.5, day: 0.95 },
};

// 赤い糸: o fio vermelho que sai da lanterna enviada pelo contato e sobe até o alto da montanha.
// Coordenadas do grupo do rio; tempos em s (desenha, fica, some)
export const REDTHREAD = {
  to: [-3, 17, -30],
  lift: 5,
  lanternTop: 1.1,
  width: 0.22,
  color: '#ff1426',
  draw: 2.8,
  hold: 14,
  fade: 2.4,
};

// 刀: o golpe de água ao clicar na katana (respiração da água). Raio do clique e do arco, gotas
export const KATANA_SLASH = {
  clickRadius: 1.6,
  // Raio mínimo do alvo na tela (px)
  minHit: 44,
  height: 1.1,
  arc: { radius: 3.1, width: 1.05, angle: 2.9, tilt: -0.6, duration: 0.8 },
  drops: 170,
  gravity: 9,
  // Onde começa a água do rio (|x| no plano do rio; as margens começam em |x| ≈ 14)
  waterEdge: 13.6,
  // 黒閃 Black Flash: a cada `every` golpes na katana, o último sai negro e vermelho
  blackFlash: { every: 3 },
};

export const LANTERNS = {
  count: { high: 36, medium: 28, low: 20 },
  maxReleased: 8,
  // Faixa em z local do rio (a câmera fica do lado +z): as lanternas andam para -z, se afastando
  laneZ: [-22, 50],
  // Dentro da água (as margens começam em |x| ≈ 14)
  laneX: [-11.5, 11.5],
  // z local da câmera no fim do caminho (= -RIVER.offsetZ) e abertura lateral por unidade de distância
  viewZ: 56,
  // Lanterna solta pelo formulário: distância à frente da câmera e tamanho
  releaseAhead: 7,
  releasedScale: 2.1,
  // Fração da correnteza para a lanterna soltada (o nome dela fica legível por mais tempo)
  releasedSpeed: 0.5,
  spread: 0.55,
  speed: 0.35,
  // Intensidade da luz: > 1 dispara o bloom (só em qualidade alta)
  glow: { night: 2.6, day: 1.1 },
  // Halo em volta (funciona mesmo sem bloom, no celular) e rastro de luz na água
  halo: { size: 1.8, night: 0.85, day: 0.35 },
  reflection: { night: 1, day: 0.45 },
  wood: { night: '#1a120c', day: '#4a3222' },
};

// 404 (迷子): névoa densa que engole o caminho
export const LOST_FOG = { range: [0.5, 11], skyMix: 0.75 };

// Voo da câmera ao entrar/sair de uma rota congelada (spec §3.4)
export const CAMERA_FLIGHT = { duration: 1.2 };

// Céu pintado (degradê, nuvens em faixa, estrelas): esfera presa à câmera, dentro do `far`
export const SKY = { radius: 240 };

// Montanhas ukiyo-e: névoa subindo do pé (mistDepth abaixo da base até mistReach da amplitude)
// e borda clara no cume puxada para a cor do sol/lua
export const MOUNTAIN_LOOK = {
  mistDepth: 3,
  mistReach: 0.4,
  night: { mist: 0.5, rim: 0.55, rimTint: 0.4 },
  day: { mist: 0.32, rim: 0.4, rimTint: 0.55 },
};

// Sugi (杉) nas cristas: fora do vale por onde a câmera passa; camadas distantes ganham
// árvores maiores para continuarem legíveis
export const FOREST = {
  count: { high: 110, medium: 75, low: 45 },
  halfWidth: 72,
  valleyHalf: 13,
  growWithDistance: 0.12,
  // Fração de matsu (pinheiro em nuvens) no meio dos sugi
  matsuShare: 0.3,
  // Além desta distância (em z) da câmera, a camada usa as árvores leves (LOD)
  lodDistance: 24,
  // Camadas além deste z (a cordilheira atrás do rio) levam metade das árvores
  farZ: -100,
};

// Kasumi (霞): faixas de névoa entre as camadas, à deriva
export const KASUMI = {
  width: 190,
  every: { high: 1, medium: 1, low: 2 },
  opacity: { night: 0.5, day: 0.6 },
  // Clareia a cor da névoa (dia: papel; noite: luar)
  lighten: { night: 0.12, day: 0.35 },
  // Some perto da câmera para não virar um borrão na tela
  fadeNear: [3, 12],
};

// Bando de pássaros cruzando o céu de tempos em tempos
export const BIRDS = {
  count: 7,
  cycle: 28,
  flight: 16,
  delay: 4,
  span: 70,
  ahead: 80,
  height: 16,
  scale: 0.55,
  opacity: { night: 0.75, day: 0.7 },
};
