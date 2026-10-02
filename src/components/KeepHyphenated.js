// Mantém palavras compostas (Self-Service, Full-stack) inteiras na linha: o navegador quebraria logo
// depois do hífen ("Self- / Service"). O texto não muda, só ganha um span sem quebra
export default function KeepHyphenated({ children }) {
  const text = String(children ?? '');
  return text.split(/(\s+)/).map((part, i) =>
    /\S-\S/.test(part) ? (
      <span key={i} className="nowrap">{part}</span>
    ) : (
      part
    ),
  );
}
