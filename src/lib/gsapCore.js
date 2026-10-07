'use client';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

// Só o núcleo do GSAP, para o que aparece na primeira tela (loader, hero, barra, cursor). Os
// plugins (ScrollTrigger, SplitText, DrawSVG, ScrambleText, CustomEase) ficam em lib/gsap, usado
// pelas partes que ligam depois (seções, rodapé): assim o carregamento não baixa ~100 KB de plugins
gsap.registerPlugin(useGSAP);

// "Desenhar" um traço de SVG sem o DrawSVG: o tracejado do tamanho do caminho, deslocado até
// sumir. drawStroke(el, 0.4) deixa 40% do traço visível
export function prepareStroke(el) {
  const length = el.getTotalLength();
  el.style.strokeDasharray = `${length} ${length}`;
  el.dataset.length = String(length);
  return length;
}

export const strokeOffset = (el, fraction) => Number(el.dataset.length) * (1 - fraction);

export { gsap, useGSAP };
