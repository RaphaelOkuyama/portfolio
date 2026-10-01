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

// Hora local de uma cidade (HH:MM), para os relógios do rodapé
export function cityTime(timeZone, date = new Date(), locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(date);
}
