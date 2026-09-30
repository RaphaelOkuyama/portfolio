// true se o navegador consegue criar um contexto WebGL
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!ctx) return false;
    // Libera o contexto de teste para não gastar um dos slots do navegador
    ctx.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
