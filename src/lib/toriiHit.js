// Ponte entre a página e a cena 3D: o canvas não recebe cliques (pointer-events: none),
// então a cena registra aqui um teste de raycast contra o torii e a página pergunta
// se um ponto da tela (em px) acerta o portão
let tester = null;

export function setToriiHitTester(fn) {
  tester = fn;
  return () => {
    if (tester === fn) tester = null;
  };
}

export function hitsTorii(clientX, clientY) {
  return tester ? tester(clientX, clientY) : false;
}
