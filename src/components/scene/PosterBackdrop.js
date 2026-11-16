// Quadro-pôster: o primeiro quadro da própria cena 3D (renderizado por scripts/poster.mjs), no lugar
// do desenho em SVG enquanto a cena não começa. Assim, quando ela entra por cima, nada muda de
// lugar. A imagem (tema 昼/夜 × tela deitada/em pé) vem do CSS (.scene-poster em globals.css):
// fundo de CSS só baixa a variação que vale para a tela, e o tema já está no <html> desde o
// primeiro paint (THEME_BOOT_SCRIPT). O quadro interno (.scene-poster-frame) é o que a abertura
// aproxima, como a câmera descendo até o torii
// `variant`: 'hero' (home no topo) ou 'frozen' (páginas internas: a câmera parada num ponto só)
export default function PosterBackdrop({ variant = 'hero' }) {
  return (
    <div className="scene-poster" data-poster={variant}>
      <div className="scene-poster-frame" />
    </div>
  );
}
