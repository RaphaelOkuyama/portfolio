// true se o navegador consegue criar um contexto WebGL. Guardado: criar o contexto de teste custa,
// e a cena pergunta duas vezes (ao baixar o three e ao montar)
let cached = null;
export function hasWebGL() {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!ctx) return (cached = false);
    // Libera o contexto de teste para não gastar um dos slots do navegador
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
    return (cached = true);
  } catch {
    return (cached = false);
  }
}
