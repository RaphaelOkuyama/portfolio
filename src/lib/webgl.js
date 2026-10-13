// Renderizadores por software: o navegador sem GPU (aceleração de hardware desligada, driver
// bloqueado, máquina virtual) desenha o WebGL na CPU. A cena 3D aí trava a página inteira (cada
// quadro do bloom leva centenas de ms), então quem cai nisso recebe o cenário pintado
const SOFTWARE = /swiftshader|basic render driver|llvmpipe|softpipe|software|warp|mesa offscreen/i;

export function isSoftwareRenderer(name) {
  return SOFTWARE.test(name ?? '');
}

// Nome do renderizador (a placa de vídeo, ou o rasterizador por software) de um contexto
function rendererOf(ctx) {
  const info = ctx.getExtension('WEBGL_debug_renderer_info');
  return String(ctx.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : ctx.RENDERER) ?? '');
}

// A cena mesmo sem GPU: ?3d na URL ou oku-3d=on no localStorage (os testes e2e rodam com WebGL por
// software e usam isto)
function forced() {
  try {
    return new URLSearchParams(window.location.search).has('3d') || window.localStorage.getItem('oku-3d') === 'on';
  } catch {
    return false;
  }
}

// true se o navegador consegue criar um contexto WebGL acelerado pela GPU. Guardado: criar o
// contexto de teste custa, e a cena pergunta duas vezes (ao baixar o three e ao montar)
let cached = null;
export function hasWebGL() {
  if (cached !== null) return cached;
  try {
    // failIfMajorPerformanceCaveat: o próprio navegador recusa quando só tem renderizador por software
    const force = forced();
    const open = (options) => {
      const canvas = document.createElement('canvas');
      return canvas.getContext('webgl2', options) || canvas.getContext('webgl', options);
    };
    const release = (ctx) => ctx?.getExtension('WEBGL_lose_context')?.loseContext();
    const ctx = open(force ? undefined : { failIfMajorPerformanceCaveat: true });
    let software = false;
    if (ctx) software = !force && isSoftwareRenderer(rendererOf(ctx));
    else if (!force) {
      // Recusado com a ressalva mas aceito sem ela: tem WebGL, só que na CPU
      const plain = open();
      software = Boolean(plain);
      release(plain);
    }
    // Libera o contexto de teste para não gastar um dos slots do navegador
    release(ctx);
    // Sem GPU a composição da página também é na CPU: a classe desliga os efeitos de CSS caros
    if (software) {
      document.documentElement.classList.add('no-gpu');
      console.info('[cena] WebGL sem GPU (renderizador por software): usando o cenário pintado. Ative a aceleração de hardware do navegador para ver a cena 3D.');
    }
    return (cached = Boolean(ctx) && !software);
  } catch {
    return (cached = false);
  }
}

// Para os efeitos de tela cheia fora da cena (o vazio do domínio): mesmo teste, num contexto já criado
export function softwareContext(ctx) {
  try {
    return !forced() && isSoftwareRenderer(rendererOf(ctx));
  } catch {
    return false;
  }
}
