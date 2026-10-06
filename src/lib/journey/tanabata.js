// 七夕: disposição dos bambus de Tanabata do Stack. Dois bambus, um de cada lado do caminho; cada
// um tem três galhos e cada galho é uma área (as tiras 短冊 daquela área ficam penduradas nele).
// Funções puras: as mesmas posições no servidor, no cliente e nos testes

// Galho de uma área: em qual bambu, a que altura do chão (fração da altura do bambu) e o comprimento
export function branchFor(area, { heights = [0.36, 0.52, 0.68], length = 2.3 } = {}) {
  const bamboo = area % 2;
  const level = Math.floor(area / 2);
  return { bamboo, height: heights[level % heights.length], length: length * (1 - level * 0.12) };
}

// Ponto do galho a uma fração `t` do comprimento: o galho sai do colmo para fora do caminho e sobe
// um pouco (side = -1 no bambu da esquerda, 1 no da direita)
export function branchPoint(base, side, height, length, t, rise = 0.32) {
  return {
    x: base.x + side * length * t,
    y: base.y + height + rise * length * t * (1 - t * 0.35),
    z: base.z + Math.sin(t * 2.4) * 0.25,
  };
}

// Uma tira por ferramenta: espalhadas ao longo do galho da área, com comprimentos de fio diferentes
// (as tiras não ficam alinhadas). bamboos: [{ x, y, z, side, height }]
export function tanzakuLayout(counts, bamboos) {
  const strips = [];
  counts.forEach((count, area) => {
    const branch = branchFor(area);
    const b = bamboos[branch.bamboo];
    for (let k = 0; k < count; k += 1) {
      const t = 0.18 + (0.8 * (k + 0.5)) / count;
      const p = branchPoint(b, b.side, branch.height * b.height, branch.length, t);
      strips.push({
        area,
        index: k,
        x: p.x,
        y: p.y - 0.06 - ((k * 7) % 3) * 0.12,
        z: p.z + ((k % 2) - 0.5) * 0.18,
        phase: area * 1.7 + k * 2.3,
      });
    }
  });
  return strips;
}

// 五色: as cores das tiras do Tanabata, uma por área do Stack (mesma ordem). A cena pinta as
// tiras e a seção usa nas tiras-botão e no painel
export const TANABATA_COLORS = ['#d8443a', '#3b6fb6', '#e8b83a', '#4f9a5b', '#7a52a6', '#f1ece2'];

// Cor do texto em cada tira: escuro no amarelo e no branco, claro nas outras
export const TANABATA_INK = ['#fff8f0', '#fff8f0', '#2a1a08', '#fff8f0', '#fff8f0', '#2a1a08'];
