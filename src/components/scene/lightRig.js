import { Color, Vector3, Vector4 } from 'three';

// Luz da cena por cima do sombreado pintado (as peças usam MeshBasicMaterial, sem luzes do three):
// - contorno do luar: a borda das peças viradas para a lua acende (a lua fica atrás, no fundo do
//   caminho, então é um contraluz, como nas cenas noturnas de cinema);
// - poças de luz das lanternas de pedra: o chão, o caminho e o que estiver perto ficam quentes.
// Um objeto de uniforms só, compartilhado por todos os materiais e atualizado por SceneLight.js
export const MAX_POOLS = 16;

export const sceneLight = {
  uMoonDir: { value: new Vector3(-0.15, 0.23, -0.96).normalize() },
  uRimColor: { value: new Color('#c4ceff') },
  uRimStrength: { value: 0 },
  // x, y, z da fonte e o raio da poça
  uPools: { value: Array.from({ length: MAX_POOLS }, () => new Vector4(0, -999, 0, 1)) },
  uPoolCount: { value: 0 },
  uPoolColor: { value: new Color('#ffc46b') },
  uPoolStrength: { value: 0 },
};

export const SCENE_LIGHT_PARS = /* glsl */ `
  uniform vec3 uMoonDir;
  uniform vec3 uRimColor;
  uniform float uRimStrength;
  uniform vec4 uPools[${MAX_POOLS}];
  uniform int uPoolCount;
  uniform vec3 uPoolColor;
  uniform float uPoolStrength;

  // Quanto as lanternas iluminam este ponto (0 longe, ~1 ao lado da lanterna)
  float scenePools(vec3 worldPos, vec3 n) {
    float pool = 0.0;
    for (int i = 0; i < ${MAX_POOLS}; i++) {
      if (i >= uPoolCount) break;
      vec4 p = uPools[i];
      vec3 d = p.xyz - worldPos;
      float fall = exp(-dot(d, d) / (p.w * p.w));
      // Superfícies viradas para a lanterna pegam mais luz
      float facing = clamp(dot(n, normalize(d + vec3(0.0, 1e-3, 0.0))) * 0.6 + 0.4, 0.0, 1.0);
      pool += fall * facing;
    }
    return pool;
  }

  vec3 sceneLight(vec3 base, vec3 worldPos, vec3 n) {
    vec3 v = normalize(cameraPosition - worldPos);
    float fresnel = pow(1.0 - clamp(abs(dot(n, v)), 0.0, 1.0), 1.8);
    float toMoon = clamp(dot(n, uMoonDir), 0.0, 1.0);
    vec3 col = base + uRimColor * fresnel * (0.2 + 0.8 * toMoon) * uRimStrength;
    float pool = scenePools(worldPos, n) * uPoolStrength;
    // A luz tinge a cor da peça e ainda soma um pouco de brilho próprio (papel aceso por perto)
    col += base * uPoolColor * pool * 2.2 + uPoolColor * pool * 0.13;
    return col;
  }
`;

// Detalhe de textura em projeção triplanar (as peças low-poly não têm UV): o tom da textura, com
// média 0,5, multiplica a cor da paleta entre 1 - amount e 1 + amount
export const DETAIL_PARS = /* glsl */ `
  uniform sampler2D uDetail;
  uniform float uDetailScale;
  uniform float uDetailAmount;
  float sceneDetail(vec3 p, vec3 n) {
    vec3 w = pow(abs(n), vec3(4.0));
    w /= (w.x + w.y + w.z + 1e-4);
    float x = texture2D(uDetail, p.zy * uDetailScale).r;
    float y = texture2D(uDetail, p.xz * uDetailScale).r;
    float z = texture2D(uDetail, p.xy * uDetailScale).r;
    return 1.0 + ((x * w.x + y * w.y + z * w.z) - 0.5) * 2.0 * uDetailAmount;
  }
`;

// Liga a luz da cena num MeshBasicMaterial (mantém o onBeforeCompile que ele já tiver).
// `detail`: { texture (holder de detailTexture), scale, amount } para o relevo do Poly Haven
export function withSceneLight(material, detail = null) {
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer);
    Object.assign(shader.uniforms, sceneLight);
    if (detail) {
      shader.uniforms.uDetail = detail.texture;
      shader.uniforms.uDetailScale = { value: detail.scale };
      shader.uniforms.uDetailAmount = { value: detail.amount };
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLitWorld;\nvarying vec3 vLitNormal;')
      .replace('#include <worldpos_vertex>', [
        '#include <worldpos_vertex>',
        'vec4 litWorld = vec4( transformed, 1.0 );',
        'vec3 litNormal = normal;',
        '#ifdef USE_INSTANCING',
        '  litWorld = instanceMatrix * litWorld;',
        '  litNormal = mat3( instanceMatrix ) * litNormal;',
        '#endif',
        'litWorld = modelMatrix * litWorld;',
        'vLitWorld = litWorld.xyz;',
        // Geometria sem normais: trata como virada para cima (sem contorno, só a poça de luz)
        'litNormal = mat3( modelMatrix ) * litNormal;',
        'vLitNormal = dot( litNormal, litNormal ) > 1e-6 ? normalize( litNormal ) : vec3( 0.0, 1.0, 0.0 );',
      ].join('\n'));
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLitWorld;\nvarying vec3 vLitNormal;\n${SCENE_LIGHT_PARS}\n${detail ? DETAIL_PARS : ''}`)
      .replace('#include <opaque_fragment>', [
        detail ? 'outgoingLight *= sceneDetail( vLitWorld, normalize( vLitNormal ) );' : '',
        'outgoingLight = sceneLight( outgoingLight, vLitWorld, normalize( vLitNormal ) );',
        '#include <opaque_fragment>',
      ].join('\n'));
  };
  // A chave padrão do three é o texto do onBeforeCompile (agora o mesmo para todos): inclui o anterior
  material.customProgramCacheKey = () => `scene-light|${detail ? 'detail' : ''}|${previous ? previous.toString() : ''}`;
  material.needsUpdate = true;
  return material;
}
