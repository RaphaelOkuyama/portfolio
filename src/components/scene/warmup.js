import { WebGLRenderTarget } from 'three';

// Compilação dos shaders fora do caminho da rolagem. O three compila um programa na hora em que o
// desenha pela primeira vez, e a thread principal para esperando (100–300 ms por shader pesado:
// era a "travada" ao rolar rápido até o rio). compileAsync compila em paralelo na GPU
// (KHR_parallel_shader_compile), mas só olha objetos visíveis: aqui os escondidos entram também.
//
// Com pós-processamento (qualidade alta) a cena é desenhada numa textura intermediária, e o three
// gera outra variação de cada shader para isso (o espaço de cor da saída muda). Por isso, com ele
// ligado, compila as duas variações: para a tela e para uma textura

const options = { offscreen: false };
let target = null;

// O Canvas avisa quando o pós-processamento liga ou desliga (troca de qualidade)
export function setOffscreenWarmup(on) {
  options.offscreen = on;
}

function compile(gl, root, camera, scene) {
  try {
    return gl.compileAsync(root, camera, scene);
  } catch (error) {
    return Promise.reject(error);
  }
}

// Compila `root` (cena ou um objeto) com todos os descendentes, mesmo os escondidos agora.
// A visibilidade original volta antes de qualquer quadro (compile() cria os programas na hora)
export function warm(gl, root, camera, scene = root) {
  const hidden = [];
  root.traverse((o) => {
    if (!o.visible) {
      hidden.push(o);
      o.visible = true;
    }
  });
  const jobs = [compile(gl, root, camera, scene)];
  if (options.offscreen) {
    target ??= new WebGLRenderTarget(1, 1);
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(target);
    jobs.push(compile(gl, root, camera, scene));
    gl.setRenderTarget(previous);
  }
  hidden.forEach((o) => { o.visible = false; });
  return Promise.all(jobs.map((j) => j.catch(() => {}))).then(() => {});
}

// Mostra `object` só depois do shader dele compilado: enquanto isso fica escondido (um quadro sem
// ele é imperceptível; um quadro esperando o shader é uma travada). Devolve a promessa
export function revealWhenCompiled(gl, object, camera, scene) {
  object.visible = false;
  return warm(gl, object, camera, scene).then(() => {
    object.visible = true;
  });
}
