// Cliques em objetos da cena 3D: o canvas fica atrás do conteúdo, então a cena escuta os cliques
// da janela e confere se caíram em cima do objeto (projetado na tela). Funções puras + o projetor

// Clique em algo da interface (link, botão, campo...): nunca é para a cena
const UI = 'a, button, input, textarea, select, label, summary, [role="button"], [role="link"], [contenteditable="true"]';
export function isUiTarget(el) {
  return Boolean(el && typeof el.closest === 'function' && el.closest(UI));
}

// Algo opaco entre o clique e a cena (cartão, painel, cabeçalho)? Sobe do alvo até o <body>
// procurando fundo não transparente ou desfoque. `styleOf` é o getComputedStyle (injetável no teste)
export function coversScene(el, styleOf = (node) => getComputedStyle(node)) {
  for (let node = el; node && node.nodeType === 1 && node.tagName !== 'BODY' && node.tagName !== 'HTML'; node = node.parentElement) {
    const style = styleOf(node);
    const alpha = backgroundAlpha(style.backgroundColor);
    if (alpha > 0.05 || (style.backgroundImage && style.backgroundImage !== 'none')) return true;
    const blur = style.backdropFilter || style.webkitBackdropFilter;
    if (blur && blur !== 'none') return true;
  }
  return false;
}

// Opacidade de uma cor CSS computada (rgb/rgba/transparent)
export function backgroundAlpha(color = '') {
  if (!color || color === 'transparent') return 0;
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return 1;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length >= 4 ? parseFloat(parts[3]) : 1;
}

// Clique que vale para a cena: fora de controles e sem nada opaco por cima
export const isSceneClick = (el) => !isUiTarget(el) && !coversScene(el);

// Clique (em px) dentro do círculo de centro (cx, cy) e raio r (em px)?
export function insideCircle(x, y, cx, cy, r) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

// Centro e raio em px de uma esfera do mundo vista pela câmera, ou null se está atrás dela.
// `center` é um Vector3 (é copiado), `scratch` dois Vector3 de rascunho
export function projectSphere(center, radius, camera, width, height, [a, b]) {
  a.copy(center).project(camera);
  if (a.z > 1 || a.z < -1) return null;
  // Um ponto na borda da esfera, deslocado no eixo "para cima" da câmera
  b.set(0, radius, 0).applyQuaternion(camera.quaternion).add(center).project(camera);
  const x = (a.x + 1) / 2 * width;
  const y = (1 - a.y) / 2 * height;
  const r = Math.hypot((b.x - a.x) / 2 * width, (b.y - a.y) / 2 * height);
  return { x, y, r };
}
