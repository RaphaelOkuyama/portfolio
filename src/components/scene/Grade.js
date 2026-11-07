'use client';
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Effect } from 'postprocessing';
import { Uniform, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';

// Gradação de cor da cena, num passe só (sem amostrar vizinhos): luzes altas que arredondam em vez
// de estourar (lanternas e lua passam de 1), contraste e saturação, sombras frias e luzes quentes
// (split toning, por tema e estação), vinheta e grão de filme animado
const fragmentShader = /* glsl */ `
  uniform vec3 uShadowTint;
  uniform vec3 uHighlightTint;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uVignette;
  uniform float uGrain;

  float grainHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Ombro suave: até 0.72 nada muda; acima, comprime em direção a 1 (sem corte seco)
  vec3 shoulder(vec3 c) {
    vec3 over = max(c - 0.72, 0.0);
    return min(c, 0.72) + over / (1.0 + over / 0.32);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = shoulder(inputColor.rgb);
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSaturation);
    // Contraste em torno do cinza médio (espaço linear)
    c = max((c - 0.18) * uContrast + 0.18, 0.0);
    float lum = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)) * 2.2, 0.0, 1.0);
    c *= mix(uShadowTint, vec3(1.0), smoothstep(0.0, 0.45, lum));
    c *= mix(vec3(1.0), uHighlightTint, smoothstep(0.45, 1.0, lum));
    // Vinheta oval, mais forte nos cantos de baixo (o olhar sobe para o céu e o torii)
    vec2 d = (uv - vec2(0.5, 0.55)) * vec2(1.0, 1.15);
    float vig = smoothstep(0.32, 0.92, length(d) * 1.35);
    c *= 1.0 - uVignette * vig;
    // Grão relativo ao tom (no espaço linear um grão somado vira chuvisco nas sombras escuras)
    float g = grainHash(uv * resolution + fract(time * 7.13) * 917.0) - 0.5;
    c *= 1.0 + g * uGrain;
    outputColor = vec4(c, inputColor.a);
  }
`;

class GradeEffect extends Effect {
  constructor() {
    super('GradeEffect', fragmentShader, {
      uniforms: new Map([
        ['uShadowTint', new Uniform(new Vector3(1, 1, 1))],
        ['uHighlightTint', new Uniform(new Vector3(1, 1, 1))],
        ['uContrast', new Uniform(1)],
        ['uSaturation', new Uniform(1)],
        ['uVignette', new Uniform(0)],
        ['uGrain', new Uniform(0)],
      ]),
    });
  }
}

// Por tema; as estações empurram as luzes altas (verão verde, outono quente, inverno frio)
const LOOK = {
  night: { shadow: [0.94, 0.97, 1.04], high: [1.07, 1.0, 0.92], contrast: 1.1, saturation: 0.96, vignette: 0.42, grain: 0.09 },
  day: { shadow: [0.98, 0.97, 0.99], high: [1.03, 1.0, 0.96], contrast: 1.05, saturation: 1.02, vignette: 0.2, grain: 0.06 },
};
const SEASON_HIGH = [[1, 0.98, 1.0], [0.97, 1.03, 0.97], [1.05, 0.99, 0.92], [0.95, 0.99, 1.06]];

function seasonTint(mix, out) {
  const i = Math.min(2, Math.floor(mix));
  const t = Math.min(1, Math.max(0, mix - i));
  const a = SEASON_HIGH[i];
  const b = SEASON_HIGH[i + 1];
  return out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}

export default function Grade() {
  const effect = useMemo(() => new GradeEffect(), []);
  const scratch = useMemo(() => ({ season: new Vector3(), target: new Vector3(), init: false }), []);

  // A vinheta da cena passa a ser a do shader: a pintada no CSS (.washi) sai
  useEffect(() => {
    document.documentElement.classList.add('has-grade');
    return () => {
      document.documentElement.classList.remove('has-grade');
      effect.dispose();
    };
  }, [effect]);

  useFrame((_, delta) => {
    const { theme, seasonMix } = journeyStore.getState();
    const look = LOOK[theme] ?? LOOK.night;
    const u = effect.uniforms;
    const k = scratch.init ? 1 - Math.exp(-delta * 3) : 1;
    scratch.init = true;
    u.get('uShadowTint').value.lerp(scratch.target.set(...look.shadow), k);
    seasonTint(seasonMix, scratch.season);
    u.get('uHighlightTint').value.lerp(scratch.target.set(...look.high).multiply(scratch.season), k);
    for (const [name, value] of [['uContrast', look.contrast], ['uSaturation', look.saturation], ['uVignette', look.vignette], ['uGrain', look.grain]]) {
      const uniform = u.get(name);
      uniform.value += (value - uniform.value) * k;
    }
  });

  return <primitive object={effect} dispose={null} />;
}
