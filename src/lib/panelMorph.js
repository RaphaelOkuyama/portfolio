import { gsap } from './gsap';

// Painel do emakimono → topo da página do projeto, sem corte:
// 1) na home o papel do painel cresce até cobrir a tela; numeral e título ficam soltos por cima
// 2) a rota troca por baixo; a página do projeto pega o que ficou solto (takeMorph)
// 3) numeral e título voam até o lugar deles no hero e o papel se dissolve revelando a página
const EXPAND = 0.55;
const LAND = 0.9;
// Se a página nova nunca reclamar o painel (erro, navegação cancelada), some sozinho
const ORPHAN_MS = 4000;

let pending = null;

function textClone(el, className) {
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const clone = document.createElement('div');
  clone.className = className;
  clone.textContent = el.textContent;
  Object.assign(clone.style, {
    position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, margin: '0',
    fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing, color: cs.color, transformOrigin: '0 0',
  });
  return { el: clone, rect, fontSize: parseFloat(cs.fontSize) };
}

function dispose(morph) {
  clearTimeout(morph.orphan);
  gsap.to(morph.root, { opacity: 0, duration: 0.3, onComplete: () => morph.root.remove() });
}

function scheduleOrphan(morph) {
  clearTimeout(morph.orphan);
  morph.orphan = setTimeout(() => {
    if (pending === morph) pending = null;
    morph.panel.style.visibility = '';
    dispose(morph);
  }, ORPHAN_MS);
}

export function startMorph({ panel, slug, onCovered }) {
  if (pending) dispose(pending);
  const rect = panel.getBoundingClientRect();
  const root = document.createElement('div');
  root.className = 'emaki-morph';
  root.setAttribute('aria-hidden', 'true');

  // O papel é uma cópia do painel: descrição, stack e chamada somem enquanto ele cresce
  const paper = panel.cloneNode(true);
  paper.removeAttribute('href');
  paper.removeAttribute('data-project');
  paper.classList.add('emaki-morph-paper');
  Object.assign(paper.style, {
    position: 'fixed', top: `${rect.top}px`, left: `${rect.left}px`,
    width: `${rect.width}px`, height: `${rect.height}px`, minHeight: '0', margin: '0',
  });
  const kanji = textClone(panel.querySelector('.emaki-number'), 'emaki-morph-kanji');
  const title = textClone(panel.querySelector('.emaki-title'), 'emaki-morph-title');
  paper.querySelectorAll('.emaki-number, .emaki-title').forEach((el) => { el.style.visibility = 'hidden'; });

  root.append(paper, kanji.el, title.el);
  document.body.appendChild(root);
  panel.style.visibility = 'hidden';

  const morph = { root, paper, kanji, title, slug, panel, landed: false };
  pending = morph;
  scheduleOrphan(morph);

  gsap.timeline({ onComplete: onCovered })
    .to([...paper.children].filter((el) => el.style.visibility !== 'hidden'), { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0)
    .to(paper, {
      top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0,
      duration: EXPAND, ease: 'power3.inOut',
    }, 0);
}

// Chamado pela página do projeto ao montar: devolve o painel em voo, se for para este slug
export function takeMorph(slug) {
  if (!pending || pending.slug !== slug) return null;
  const morph = pending;
  pending = null;
  clearTimeout(morph.orphan);
  return morph;
}

// O efeito que pegou o painel foi desfeito antes do pouso (Strict Mode remonta os efeitos no
// dev; uma re-execução faz o mesmo): devolve à fila para a próxima montagem pousar
export function returnMorph(morph) {
  if (morph.landed || pending) return;
  pending = morph;
  scheduleOrphan(morph);
}

// Leva numeral e título até os do hero e dissolve o papel. Os alvos já devem estar invisíveis.
// Anima posição, largura e corpo da fonte (não scale): o texto segue nítido em voo e chega
// quebrando as linhas exatamente como o título do hero
function flyTo(clone, target) {
  const rect = target.getBoundingClientRect();
  const cs = getComputedStyle(target);
  // Peso e família não interpolam: assumem os do alvo já na largada (senão a quebra de linha
  // final difere do título real e a troca aparece)
  clone.style.fontWeight = cs.fontWeight;
  clone.style.fontFamily = cs.fontFamily;
  return {
    left: rect.left, top: rect.top, width: rect.width,
    fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
    duration: LAND, ease: 'power3.inOut',
  };
}

export function landMorph(morph, { kanji: kanjiTarget, title: titleTarget }) {
  const { root, paper, kanji, title } = morph;
  morph.landed = true;
  const tl = gsap.timeline({ onComplete: () => root.remove() });

  tl.to(title.el, flyTo(title.el, titleTarget), 0)
    .to(title.el, { opacity: 0, duration: 0.25 }, LAND - 0.1)
    .fromTo(titleTarget, { opacity: 0 }, { opacity: 1, duration: 0.25, clearProps: 'opacity' }, LAND - 0.15);

  // No celular o numeral grande do hero não aparece: o pequeno só se apaga
  if (kanjiTarget && kanjiTarget.getBoundingClientRect().width > 0) {
    tl.to(kanji.el, flyTo(kanji.el, kanjiTarget), 0)
      // A tinta cheia do painel vira o contorno vazado do hero
      .to(kanji.el, { opacity: 0, duration: 0.45 }, LAND - 0.3)
      .fromTo(kanjiTarget, { opacity: 0 }, { opacity: 0.55, duration: 0.5, clearProps: 'opacity' }, LAND - 0.35);
  } else {
    tl.to(kanji.el, { opacity: 0, duration: 0.3 }, 0);
  }

  tl.to(paper, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.2);
  return tl;
}
