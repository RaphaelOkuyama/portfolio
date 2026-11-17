// 演出: a camada de cinema do domínio, na linguagem dos animes de ação.
//  · barras de cinema em cima e embaixo (a tela vira scope enquanto o domínio dura)
//  · a esfera negra do domínio fechando em volta da tela, até o ponto de quem abriu
//  · 集中線: as linhas de velocidade que apontam para o centro nos golpes
//  · quadros de impacto: a imagem inteira em negativo e, logo depois, o clarão desenhado (a estrela
//    de pontas irregulares em branco sobre o preto), cada um por dois ou três quadros
//  · a tinta: o filtro que deixa a borda dos ideogramas da cartela irregular, como pincel
//  · reflexo de lente em risca, grão de película e vinheta
// Só marcação: quem anima é a linha do tempo de DomainExpansion

// 閃光: estrela de pontas desiguais (semente fixa: o mesmo desenho em toda visita)
const BURST = (() => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const spikes = 34;
  const points = [];
  for (let i = 0; i < spikes; i += 1) {
    const a = (i / spikes) * Math.PI * 2;
    const half = Math.PI / spikes;
    const long = 70 + rand() * 90;
    const short = 16 + rand() * 12;
    points.push(`${(Math.cos(a) * long).toFixed(1)},${(Math.sin(a) * long).toFixed(1)}`);
    points.push(`${(Math.cos(a + half) * short).toFixed(1)},${(Math.sin(a + half) * short).toFixed(1)}`);
  }
  return points.join(' ');
})();

// Por baixo do texto: as barras, as linhas de velocidade e o reflexo de lente
export function CinemaUnder() {
  return (
    <div className="dx-cine" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="dx-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="dx-sphere" />
      <div className="dx-lines" />
      <div className="dx-flare" />
      <div className="dx-bar dx-bar-top" />
      <div className="dx-bar dx-bar-bottom" />
    </div>
  );
}

// Por cima de tudo: vinheta, grão e os quadros de impacto
export function CinemaOver() {
  return (
    <div className="dx-cine dx-cine-over" aria-hidden="true">
      <div className="dx-vignette" />
      <div className="dx-grain" />
      <div className="dx-impact" />
      <div className="dx-burst">
        <svg viewBox="-100 -62 200 124" preserveAspectRatio="xMidYMid slice">
          <polygon points={BURST} fill="#fff" />
        </svg>
      </div>
    </div>
  );
}
