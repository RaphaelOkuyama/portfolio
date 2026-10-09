// 印: o selo de mão do Vazio Infinito. Mão direita erguida com a palma para quem olha: indicador e
// médio levantados e cruzados (o médio passa por trás do indicador), anelar e mínimo dobrados para
// dentro da palma e presos pelo polegar. Desenhada em traço de luz azul-gelo sobre a silhueta
// escura: cada dedo é um traço grosso de ponta redonda (o contorno) com outro mais fino por cima
// (o miolo), e as juntas e unhas em traço fino
const OUTLINE = '#d9ecff';
const FILL = '#060a16';

function Finger({ d, w }) {
  return (
    <g>
      <path d={d} fill="none" stroke={OUTLINE} strokeWidth={w + 4.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={FILL} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

const Detail = ({ d, opacity = 0.75 }) => (
  <path d={d} fill="none" stroke={OUTLINE} strokeWidth="1.5" strokeLinecap="round" opacity={opacity} />
);

export default function HandSeal() {
  return (
    <div className="dx-seal" aria-hidden="true">
      <svg viewBox="0 0 220 320" className="dx-seal-svg">
        <defs>
          <filter id="dx-seal-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#dx-seal-glow)">
          {/* Antebraço */}
          <path d="M66 320 L72 262 M162 320 L154 262" fill="none" stroke={OUTLINE} strokeWidth="2.4" strokeLinecap="round" />
          {/* Palma larga, com o monte do polegar à esquerda */}
          <path
            d="M72 266 C58 246 52 220 56 196 C58 176 66 160 80 152 L148 148 C162 154 170 170 168 192 C166 218 160 244 154 266 Z"
            fill={FILL}
            stroke={OUTLINE}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Mínimo e anelar dobrados para dentro da palma (as costas das falanges à mostra) */}
          <Finger d="M160 162 C172 170 172 186 158 192" w={18} />
          <Finger d="M142 156 C160 164 160 190 140 196" w={21} />
          {/* Polegar atravessando a palma e prendendo os dois, com a unha */}
          <Finger d="M76 238 C84 214 104 196 140 186" w={25} />
          <Detail d="M126 182 c6 -1 11 1 13 5" />
          {/* Médio (atrás): sobe e cruza para a esquerda */}
          <Finger d="M126 154 C124 120 112 86 92 46" w={24} />
          {/* Indicador (na frente): sobe e cruza para a direita */}
          <Finger d="M96 156 C96 120 106 86 126 50" w={24} />
          {/* Juntas do indicador e do médio, unhas e a linha da vida */}
          <Detail d="M97 122 l12 2 M101 96 l11 3 M112 112 l10 -2" />
          <Detail d="M120 58 c4 -3 9 -2 11 2 M94 52 c3 -4 8 -4 11 -1" opacity={0.6} />
          <Detail d="M82 232 C100 246 128 248 150 238" opacity={0.55} />
        </g>
      </svg>
    </div>
  );
}
