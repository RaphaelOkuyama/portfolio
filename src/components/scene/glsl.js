// Ruído de valor + fbm compartilhado pelos shaders pintados (céu, montanhas, kasumi, lua)
export const NOISE = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  #ifndef FBM_OCTAVES
  #define FBM_OCTAVES 4
  #endif

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < FBM_OCTAVES; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + 17.1;
      a *= 0.5;
    }
    return v;
  }
`;

// Menos oitavas no celular: o fbm roda por pixel em áreas grandes da tela
export function noiseDefines(quality) {
  return { FBM_OCTAVES: quality === 'high' ? 4 : 3 };
}
