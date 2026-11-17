// 花火大会: o festival de fogos (palavra secreta). Funções puras: a palavra, os atos e o
// programa, isto é, a lista de instantes em que cada fogo sobe. Quem desenha é a cena 3D
// (scene/Fireworks) ou, sem ela, o próprio componente (hanabi/Hanabi)

export const HANABI = {
  // Palavra secreta (digitada fora de campos de texto)
  words: ['hanabi'],
  // Câmera lenta: o relógio das faíscas anda a esta fração do tempo real (subida, abertura e queda)
  slow: 0.7,
  // O programa estica junto, para cada fogo ter tempo de abrir e cair antes do próximo
  pace: 1.4,
};

// Os atos do programa, na ordem dos festivais japoneses: cada um mostra um tipo de fogo
export const HANABI_ACTS = [
  {
    id: 'kaimaku', jp: '開幕', name: { pt: 'Abertura', en: 'Opening' },
    text: { pt: 'Kiku e botan: o crisântemo de rastros e a peônia de pontos, as esferas perfeitas dos fogos japoneses.', en: 'Kiku and botan: the trailing chrysanthemum and the dotted peony, the perfect spheres of Japanese fireworks.' },
  },
  {
    id: 'katamono', jp: '型物', name: { pt: 'Katamono · formas', en: 'Katamono · shapes' },
    text: { pt: 'Cascas montadas à mão para desenhar no céu: corações e anéis.', en: 'Shells packed by hand to draw in the sky: hearts and rings.' },
  },
  {
    id: 'starmine', jp: 'スターマイン', name: { pt: 'Starmine · rajada', en: 'Starmine · rapid fire' },
    text: { pt: 'Dezenas de cascas em sequência, varrendo o céu de um lado ao outro.', en: 'Dozens of shells in a row, sweeping the sky from side to side.' },
  },
  {
    id: 'senrin', jp: '千輪', name: { pt: 'Senrin · mil flores', en: 'Senrin · a thousand flowers' },
    text: { pt: 'Uma casca que se abre em várias flores pequenas, uma depois da outra.', en: 'One shell that opens into many small flowers, one after another.' },
  },
  {
    id: 'niagara', jp: 'ナイアガラ', name: { pt: 'Niágara', en: 'Niagara' },
    text: { pt: 'A cortina de faíscas caindo da ponte, como nos festivais à beira do rio.', en: 'The curtain of sparks falling from the bridge, as in riverside festivals.' },
  },
  {
    id: 'yonshaku', jp: '四尺玉', name: { pt: 'Yonshakudama · a casca gigante', en: 'Yonshakudama · the giant shell' },
    text: { pt: 'A maior do mundo, do festival de Katakai, em Niigata: 1,2 m de casca e uma flor de 800 m. Cada ponta dela vira outro fogo.', en: 'The largest in the world, from the Katakai festival in Niigata: a 1.2 m shell and an 800 m flower. Each tip becomes another firework.' },
  },
  {
    id: 'kamuro', jp: '冠菊', name: { pt: 'Kamuro · o final dourado', en: 'Kamuro · the golden finale' },
    text: { pt: 'A coroa de ouro que desce devagar até quase tocar a água.', en: 'The golden crown that falls slowly until it almost touches the water.' },
  },
  {
    id: 'otori', jp: '大トリ', name: { pt: 'Ōtori · o último', en: 'Ōtori · the last one' },
    text: { pt: 'Uma bolinha só sobe no escuro. Ela abre do tamanho do céu inteiro e cada faísca vira outra flor.', en: 'A single shell climbs in the dark. It opens as wide as the whole sky and every spark becomes another flower.' },
  },
];

const ACT = Object.fromEntries(HANABI_ACTS.map((a, i) => [a.id, i]));

// O programa do festival: [{ t, act }, { t, fire }, { t, niagara }, { t, end }] em ordem de tempo
// (s). `fire` é o pedido de um fogo: tipo, posição no céu (x de -1 a 1, y de 0 a 1), tamanho e
// tempo de subida. `rand` devolve [0, 1) (injetável para teste)
export function hanabiProgram(rand = Math.random) {
  const steps = [];
  const act = (t, id) => steps.push({ t, act: ACT[id] });
  const fire = (t, request) => steps.push({ t, fire: request });

  act(0.3, 'kaimaku');
  fire(1.4, { kind: 'kiku', big: true, x: 0, y: 0.6, color: 0 });
  fire(3.0, { kind: 'botan', x: -0.55, y: 0.35, color: 2 });
  fire(3.8, { kind: 'botan', x: 0.55, y: 0.4, color: 1 });
  fire(5.0, { kind: 'double', big: true, x: -0.2, y: 0.8 });
  fire(6.0, { kind: 'kiku', x: 0.4, y: 0.5, color: 3 });
  fire(6.9, { kind: 'kiku', big: true, x: -0.65, y: 0.55, color: 4 });

  act(8.4, 'katamono');
  fire(8.7, { kind: 'heart', big: true, x: -0.45, y: 0.6 });
  fire(9.7, { kind: 'ring', big: true, x: 0.45, y: 0.55 });
  fire(10.7, { kind: 'heart', big: true, x: 0.1, y: 0.9 });
  fire(11.5, { kind: 'ring', x: -0.7, y: 0.3 });
  fire(12.2, { kind: 'heart', x: 0.7, y: 0.4 });

  act(13.8, 'starmine');
  for (let i = 0; i < 34; i += 1) {
    fire(14.2 + i * 0.17, { x: Math.sin(i * 0.55) * 0.85, y: rand(), big: i % 4 === 0, kind: i % 6 === 5 ? 'ring' : undefined, rise: 0.6 });
  }

  act(20.8, 'senrin');
  fire(21.0, { kind: 'senrin', big: true, x: -0.5, y: 0.6 });
  fire(22.1, { kind: 'senrin', big: true, x: 0.45, y: 0.7 });
  fire(23.1, { kind: 'senrin', big: true, x: 0, y: 0.45 });
  fire(24.0, { kind: 'senrin', x: 0.75, y: 0.4 });
  fire(24.4, { kind: 'senrin', x: -0.8, y: 0.35 });

  act(26.2, 'niagara');
  steps.push({ t: 26.6, niagara: 8.5 });
  fire(28.2, { kind: 'yanagi', big: true, x: -0.5, y: 0.7 });
  fire(29.8, { kind: 'yanagi', big: true, x: 0.5, y: 0.75 });
  fire(31.6, { kind: 'yanagi', big: true, x: 0, y: 0.95 });

  // Um instante de céu escuro antes da gigante
  act(35.4, 'yonshaku');
  fire(36.4, { kind: 'giant', x: 0, y: 0.72, rise: 2.4 });

  act(43.4, 'kamuro');
  [-0.8, -0.4, 0, 0.4, 0.8].forEach((x, i) => fire(43.8 + i * 0.12, { kind: 'kamuro', big: true, x, y: 0.7, rise: 1 }));
  [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => fire(45.8 + i * 0.12, { kind: 'kamuro', big: true, x, y: 1, rise: 1.1 }));
  for (let i = 0; i < 28; i += 1) fire(47.2 + i * 0.15, { finale: true, x: rand() * 2 - 1, y: rand() });
  fire(51.4, { kind: 'giant', x: -0.45, y: 0.6, rise: 1.6 });
  fire(52.0, { kind: 'giant', x: 0.45, y: 0.6, rise: 1.6 });
  [-0.85, -0.42, 0, 0.42, 0.85].forEach((x, i) => fire(53.6 + i * 0.1, { kind: 'kamuro', big: true, x, y: 0.85, rise: 1.1 }));

  // 大トリ: o céu apaga, uma bolinha só sobe devagar e abre cobrindo a tela inteira; depois cada
  // pedaço vira uma flor menor, também de ponta a ponta (ver o tipo `otori` em scene/Fireworks)
  act(58.2, 'otori');
  fire(59.0, { kind: 'otori', x: 0, rise: 4 });

  steps.push({ t: 71, end: true });
  // Tudo mais devagar (tempo real): ver HANABI.pace
  steps.forEach((step) => {
    step.t *= HANABI.pace;
    if (step.niagara) step.niagara *= HANABI.pace;
  });
  return steps.sort((a, b) => a.t - b.t);
}
