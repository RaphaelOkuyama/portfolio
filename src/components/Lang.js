// Texto bilíngue renderizado no servidor: os dois idiomas vão no HTML e o CSS mostra o do
// <html lang> (trocado pelo SettingsContext), sem hidratar estado de idioma no cliente
export default function Lang({ pt, en }) {
  if (pt === en) return pt;
  return (
    <>
      <span data-lang="pt">{pt}</span>
      <span data-lang="en">{en}</span>
    </>
  );
}
