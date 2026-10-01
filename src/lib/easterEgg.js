// Easter egg 千羽鶴 (senbazuru, mil tsurus): código Konami ou 5 carimbadas seguidas no hanko

export const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
];

// Recebe teclas uma a uma; true quando a sequência fecha. Errou: recomeça (aproveitando a tecla)
export function createKonamiMatcher(sequence = KONAMI) {
  let index = 0;
  return (key) => {
    const k = key.length === 1 ? key.toLowerCase() : key;
    if (k === sequence[index]) index += 1;
    else index = k === sequence[0] ? 1 : 0;
    if (index === sequence.length) {
      index = 0;
      return true;
    }
    return false;
  };
}

// Conta cliques dentro de uma janela de tempo; true no n-ésimo (e zera)
export function createClickCounter(count = 5, windowMs = 2000) {
  let times = [];
  return (now) => {
    times = [...times.filter((t) => now - t < windowMs), now];
    if (times.length >= count) {
      times = [];
      return true;
    }
    return false;
  };
}

// Evento global que dispara o bando (o rodapé e o teclado conversam por ele)
export const TSURU_EVENT = 'okuyama:tsuru';
