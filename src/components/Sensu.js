// 扇子 (sensu): o fundo do menu do celular é um leque de papel com o pivô no canto superior
// direito (onde fica o botão). Cada lâmina é uma fatia do leque; o Navbar gira as lâminas a partir
// da primeira (fechado) até a posição delas (aberto). Raio maior que a diagonal: aberto, cobre a tela
export const SENSU_BLADES = 12;
const START = 90; // aponta para baixo, ao longo da borda direita
const END = 180; // aponta para a esquerda, ao longo do topo

export const sensuStep = (END - START) / SENSU_BLADES;

const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
};

export default function Sensu({ width, height }) {
  const pivot = [width, 0];
  const radius = Math.hypot(width, height) * 1.04;
  const blades = Array.from({ length: SENSU_BLADES }, (_, i) => {
    const a0 = START + i * sensuStep;
    const a1 = a0 + sensuStep;
    // Borda da lâmina em arco (três pontos), para o papel não ficar com cantos retos
    const arc = [0, 0.5, 1].map((t) => polar(...pivot, radius, a0 + (a1 - a0) * t));
    const d = `M${pivot[0]} ${pivot[1]} L${arc.map((p) => p.join(' ')).join(' L')} Z`;
    const [gx, gy] = polar(...pivot, radius * 0.9, a0);
    const [ex, ey] = polar(...pivot, radius * 0.9, a1);
    return { i, d, rib: polar(...pivot, radius * 0.985, a0), gold: `M${gx} ${gy} L${ex} ${ey}` };
  });

  return (
    <svg className="sensu" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" data-sensu="">
      {blades.map(({ i, d, rib, gold }) => (
        <g key={i} className="sensu-blade" data-blade={i}>
          <path d={d} className={i % 2 ? 'sensu-paper is-alt' : 'sensu-paper'} />
          {/* Filete dourado perto da borda, como nos leques de festa */}
          <path d={gold} className="sensu-gold" />
          {/* Vareta (骨) de madeira na dobra da lâmina */}
          <line x1={pivot[0]} y1={pivot[1]} x2={rib[0]} y2={rib[1]} className="sensu-rib" />
        </g>
      ))}
      {/* O rebite (要, kaname) que prende as varetas */}
      <circle cx={pivot[0]} cy={pivot[1]} r="14" className="sensu-rivet" />
    </svg>
  );
}
