// Houve navegação dentro do site nesta visita? O "Voltar" da página de projeto usa o histórico só
// quando a página anterior é do próprio site; quem chegou direto (Google, link compartilhado) volta
// para a lista de projetos em vez de sair do site
let internal = false;

export function markInternalNavigation() {
  internal = true;
}

export function hasInternalHistory() {
  return internal;
}
