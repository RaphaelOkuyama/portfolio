import { readingOf } from '../lib/furigana';

// Kanji com a leitura (furigana) por cima; sem leitura conhecida, só o texto.
// <rp> mostra a leitura entre parênteses em navegadores sem suporte a ruby
export default function Ruby({ children, reading }) {
  const text = String(children);
  const rt = reading ?? readingOf(text);
  if (!rt) return text;
  return (
    <ruby className="furigana">
      {text}
      <rp>(</rp>
      <rt>{rt}</rt>
      <rp>)</rp>
    </ruby>
  );
}
