// Acesso ao scroll suave (Lenis) fora do SmoothScroll: quem precisa rolar a página por código
// (ex.: "voltar ao topo" do rodapé) usa estas funções, com ou sem Lenis ativo
let lenis = null;

export function setLenis(instance) {
  lenis = instance;
}

export function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.8 });
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}

// Rola até uma seção da página (trilho de kanji): suave com Lenis, direto com movimento reduzido
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY;
  if (lenis) {
    lenis.scrollTo(y, { duration: 1.4 });
    return;
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}

// Hora local de uma cidade (HH:MM), para os relógios do rodapé
export function cityTime(timeZone, date = new Date(), locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(date);
}
