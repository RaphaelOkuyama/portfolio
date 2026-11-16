'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector3, Vector4 } from 'three';
import { journeyStore, effectiveProgress, useJourney } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { smoothstep } from '../../lib/journey/math';
import { getCameraCurve } from './useCameraMap';
import { NOISE, noiseDefines } from './glsl';
import Lanterns from './Lanterns';
import Koi from './Koi';
import { TSUKUYOMI, tsukuyomi } from '../../lib/journey/tsukuyomi';
import { MAX_RIPPLES, RIPPLE, anyRipple, rippleAge, ripples } from '../../lib/journey/ripples';
import RedThread from './RedThread';
import { warm } from './warmup';
import { LANTERNS, RIVER, TAIKOBASHI } from './config';
import { celestialWorld } from './Celestial';

// Máximo de reflexos: lanternas fixas + soltas pelo formulário
export const MAX_REFLECTIONS = LANTERNS.count.high + LANTERNS.maxReleased;

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vLocal;
  varying float vDepth;
  varying vec3 vWorld;
  void main() {
    vLocal = position.xy;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

// Coordenadas locais do plano: x lateral, y ao longo do rio (y maior = mais longe da câmera)
const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uWater;
  uniform vec3 uSky;
  uniform vec3 uGlow;
  uniform float uSkyReflection;
  uniform float uReflection;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uLanterns[${MAX_REFLECTIONS}]; // x, y no plano, intensidade
  uniform int uCount;
  uniform vec4 uRipples[${MAX_RIPPLES}]; // x, y no plano, idade (s), força (0 = vazio)
  uniform vec3 uMoon;      // posição da lua (ou do sol) no mundo
  uniform vec3 uMoonColor;
  uniform float uGlitter;
  uniform vec3 uCenter;    // centro do rio no mundo
  uniform vec3 uBridgeRed;
  uniform vec3 uBridgeDark;
  uniform float uBridge;
  varying vec2 vLocal;
  varying float vDepth;
  varying vec3 vWorld;
  ${NOISE}

  void main() {
    float t = uTime;
    // Ondulação: marolas alongadas na horizontal, descendo o rio
    float ripple = fbm(vec2(vLocal.x * 0.5, vLocal.y * 2.2 - t * 0.5));
    float fine = fbm(vec2(vLocal.x * 1.6 + 7.0, vLocal.y * 6.0 - t * 1.1));

    // Reflexo do céu cresce com a distância (ângulo rasante), quebrado pelas marolas
    float grazing = smoothstep(4.0, 45.0, vDepth);
    vec3 col = mix(uWater, uSky, grazing * uSkyReflection * (0.75 + 0.5 * ripple));
    // Linhas de brilho das marolas, como nas gravuras de água
    float lines = smoothstep(0.64, 0.72, fbm(vec2(vLocal.x * 0.22, vLocal.y * 3.2 - t * 0.6)));
    col = mix(col, uSky, lines * 0.18 * (1.0 - grazing * 0.5));

    // 太鼓橋 refletida: para cada ponto da água, a altura que a câmera veria espelhada ali, no
    // plano da ponte; se cair dentro do tabuleiro ou do corrimão, a água pega a cor dele. As
    // marolas tremem a imagem, mais quanto mais longe da ponte
    float bridgeY = uCenter.z - (${TAIKOBASHI.z.toFixed(1)});
    float camY = uCenter.z - cameraPosition.z;
    float camH = max(cameraPosition.y - uCenter.y, 0.2);
    float span = bridgeY - camY;
    float toBridge = bridgeY - vLocal.y;
    if (uBridge > 0.001 && span > 1.0 && toBridge > 0.0 && toBridge < span - 0.5) {
      float wobble = (ripple - 0.5) * 1.6 + (fine - 0.5) * 0.9;
      float h = camH * toBridge / (span - toBridge) + wobble * (0.1 + toBridge * 0.022);
      float camX = cameraPosition.x - uCenter.x;
      float bx = camX + (vLocal.x - camX) * span / (span - toBridge) + wobble * 0.35;
      float halfSpan = ${(TAIKOBASHI.span / 2).toFixed(1)};
      float arch = ${TAIKOBASHI.rise.toFixed(1)} * (1.0 - (bx / halfSpan) * (bx / halfSpan));
      float inside = step(abs(bx), halfSpan);
      float deck = smoothstep(arch - 0.7, arch - 0.4, h) * (1.0 - smoothstep(arch + 0.45, arch + 0.7, h));
      float rail = smoothstep(arch + 0.45, arch + 0.7, h) * (1.0 - smoothstep(arch + 1.7, arch + 2.0, h));
      // Colado na câmera a imagem estica demais: some antes disso
      float fadeOut = 1.0 - smoothstep(0.5, 0.95, toBridge / span);
      // À noite o tabuleiro escuro some na água escura: ali quem aparece é o vermelho
      col = mix(col, mix(uBridgeDark, uBridgeRed, 0.3), deck * inside * fadeOut * 0.42 * uBridge);
      col = mix(col, uBridgeRed, rail * inside * fadeOut * 0.32 * uBridge);
    }
    // Sombra da ponte na água, logo embaixo dela
    float underBridge = (vLocal.y - bridgeY) / 2.4;
    col *= 1.0 - 0.3 * uBridge * exp(-underBridge * underBridge) * step(abs(vLocal.x), ${(TAIKOBASHI.span / 2).toFixed(1)});

    // 月の道: o caminho da lua na água. O reflexo dela se quebra nas marolas em lascas de luz
    // que se alinham entre a câmera e a lua (de dia, o mesmo com o sol, mais fraco)
    vec3 wn = normalize(vec3((ripple - 0.5) * 0.55 + (fine - 0.5) * 0.3, 1.0, (fine - 0.5) * 0.6));
    vec3 toEye = normalize(cameraPosition - vWorld);
    float mirror = max(dot(reflect(-toEye, wn), normalize(uMoon - vWorld)), 0.0);
    float glints = smoothstep(0.52, 0.8, fine);
    col += uMoonColor * uGlitter * (pow(mirror, 70.0) * (0.5 + 2.0 * glints) + pow(mirror, 9.0) * 0.2);

    // Lanternas: poça de luz em volta + rastro vertical tremido na direção da câmera
    vec3 light = vec3(0.0);
    for (int i = 0; i < ${MAX_REFLECTIONS}; i++) {
      if (i >= uCount) break;
      vec3 l = uLanterns[i];
      float dy = l.y - vLocal.y;
      float wobble = sin(vLocal.y * 5.0 + t * 2.2 + l.x) * 0.12 + (fine - 0.5) * 0.35;
      float dx = vLocal.x - l.x + wobble * clamp(dy, 0.0, 3.0);
      float streak = exp(-dx * dx / 0.05) * exp(-max(dy, 0.0) * 0.55) * step(-0.25, dy);
      float pool = exp(-(dx * dx + dy * dy) / 0.5);
      light += uGlow * l.z * (streak * (0.45 + 0.9 * fine) + pool * 0.35);
    }
    col += light * uReflection;

    // 波紋: anéis abrindo onde as gotas caíram (um anel forte na frente e um fraco atrás)
    float rings = 0.0;
    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w <= 0.0) continue;
      float d = length(vLocal - r.xy);
      float front = r.z * ${RIPPLE.speed.toFixed(2)};
      float fade = r.w * (1.0 - r.z / ${RIPPLE.life.toFixed(2)}) / (1.0 + front * 0.6);
      float ring = exp(-pow(d - front, 2.0) / 0.03) + 0.5 * exp(-pow(d - front * 0.62, 2.0) / 0.02);
      rings += ring * fade;
    }
    col = mix(col, mix(uSky, vec3(0.8, 0.9, 1.0), 0.45), clamp(rings, 0.0, 1.0) * 0.85);

    // Céu refletido perto da câmera: um véu do céu sobre a água escura e as estrelas tremendo nas
    // marolas (à noite o rio deixava de ser um buraco preto na metade de baixo da tela)
    col = mix(col, uSky, (1.0 - grazing) * 0.22 * uSkyReflection);
    vec2 starCell = floor(vec2(vLocal.x * 1.6 + (fine - 0.5) * 0.9, vLocal.y * 0.7 - t * 0.05));
    float starSeed = hash21(starCell);
    float star = step(0.965, starSeed) * smoothstep(0.55, 0.0, length(fract(vec2(vLocal.x * 1.6 + (fine - 0.5) * 0.9, vLocal.y * 0.7 - t * 0.05)) - 0.5));
    col += vec3(0.85, 0.9, 1.0) * star * (0.35 + 0.35 * sin(t * 3.0 + starSeed * 40.0)) * uSkyReflection * (1.0 - grazing * 0.7);

    // Margens irregulares que se fundem com o chão
    float halfW = ${(RIVER.size[0] / 2).toFixed(1)};
    float bank = smoothstep(0.0, 2.5 + fbm(vec2(vLocal.y * 0.15, 3.0)) * 3.0, halfW - abs(vLocal.x));
    gl_FragColor = vec4(col, uOpacity * bank);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// Rio ao fim da jornada, onde as lanternas do contato descem até sumirem na névoa
export default function River() {
  const start = useJourney((s) => s.sectionRanges.contato?.[0]) ?? RIVER.fallbackStart;
  const quality = useJourney((s) => s.quality);
  const lite = useJourney((s) => s.lite);
  const scene = useThree((s) => s.scene);
  const groupRef = useRef(null);

  // Centro do rio: adiante e abaixo do fim do caminho da câmera
  const center = useMemo(() => {
    const end = getCameraCurve().getPointAt(1);
    return [end.x, end.y - RIVER.drop, end.z + RIVER.offsetZ];
  }, []);

  const geometry = useMemo(() => new PlaneGeometry(RIVER.size[0], RIVER.size[1], 1, 1), []);
  const reflections = useMemo(
    () => ({
      lanterns: { value: Array.from({ length: MAX_REFLECTIONS }, () => new Vector3()) },
      count: { value: 0 },
    }),
    [],
  );
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: noiseDefines(quality),
        transparent: true,
        depthWrite: false,
        fog: true,
        uniforms: {
          ...UniformsUtils.merge([
            UniformsLib.fog,
            {
              uWater: { value: new Color() },
              uSky: { value: new Color() },
              uGlow: { value: new Color() },
              uSkyReflection: { value: 0 },
              uReflection: { value: 0 },
              uTime: { value: 0 },
              uOpacity: { value: 0 },
            },
          ]),
          // Compartilhados com as lanternas, que escrevem as posições a cada frame
          uLanterns: reflections.lanterns,
          uCount: reflections.count,
          uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new Vector4()) },
          uMoon: { value: celestialWorld },
          uMoonColor: { value: new Color() },
          uGlitter: { value: 0 },
          uCenter: { value: new Vector3() },
          uBridgeRed: { value: new Color() },
          uBridgeDark: { value: new Color() },
          uBridge: { value: 0 },
        },
      }),
    [quality, reflections],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  // Material novo (troca de qualidade): o rio só aparece de novo depois do shader compilado
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const compiling = useRef(false);
  useEffect(() => {
    if (!groupRef.current) return;
    compiling.current = true;
    warm(gl, groupRef.current, camera, scene).then(() => { compiling.current = false; });
  }, [material, gl, camera, scene]);
  // Lanterna solta pelo formulário mais recente: as lanternas escrevem, as carpas seguem
  const released = useMemo(() => ({ item: null, at: 0 }), []);
  // As carpas só aparecem no fim da jornada: montam quando a rolagem se aproxima do rio (antes,
  // junto com a cena, engordavam a tarefa do primeiro quadro; quem não chega ao fim nem paga)
  const [withKoi, setWithKoi] = useState(false);
  useEffect(() => {
    if (withKoi) return undefined;
    const near = (state) => effectiveProgress(state) > start - 0.55;
    if (near(journeyStore.getState())) {
      setWithKoi(true);
      return undefined;
    }
    return journeyStore.subscribe((state) => {
      if (near(state)) setWithKoi(true);
    });
  }, [start, withKoi]);

  const target = useMemo(() => new Color(), []);
  const blood = useMemo(() => new Color(TSUKUYOMI.water), []);
  const init = useRef(false);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const journey = journeyStore.getState();
    // O rio faz parte da paisagem (margens, ponte, pagode): surge no fim dos Projetos, bem antes
    // do contato, para o vale nunca aparecer como uma planície vazia no lugar da água
    const opacity = smoothstep(start - 0.4, start - 0.24, effectiveProgress(journey));
    group.visible = opacity > 0.001 && !compiling.current;
    if (!group.visible) return;
    const { theme } = journey;
    const u = material.uniforms;
    const k = init.current ? 1 - Math.exp(-delta * 4) : 1;
    init.current = true;
    target.set(SCENE_ACCENTS[theme].water);
    if (tsukuyomi.mix > 0) target.lerp(blood, tsukuyomi.mix);
    u.uWater.value.lerp(target, k);
    if (scene.fog) u.uSky.value.copy(scene.fog.color);
    target.set(SCENE_ACCENTS[theme].lantern);
    u.uGlow.value.lerp(target, k);
    u.uSkyReflection.value += (RIVER.skyReflection[theme] - u.uSkyReflection.value) * k;
    u.uReflection.value += (LANTERNS.reflection[theme] - u.uReflection.value) * k;
    u.uOpacity.value = opacity;
    u.uCenter.value.set(...center);
    u.uMoonColor.value.lerp(target.set(SCENE_ACCENTS[theme].celestial), k);
    u.uGlitter.value += (RIVER.glitter[theme] - u.uGlitter.value) * k;
    u.uBridgeRed.value.lerp(target.set(SCENE_ACCENTS[theme].torii), k);
    u.uBridgeDark.value.lerp(target.set(SCENE_ACCENTS[theme].toriiTop), k);
    // Sem GPU o reflexo da ponte fica de fora (mais contas por pixel na tela toda)
    u.uBridge.value = journey.lite ? 0 : 1;
    if (!journey.reducedMotion) u.uTime.value += delta;
    // Anéis: do mundo para o plano do rio (x lateral, y = -z do grupo)
    const nowS = performance.now() / 1000;
    ripples.items.forEach((r, i) => {
      const age = rippleAge(r, nowS);
      u.uRipples.value[i].set(r.x - center[0], -(r.z - center[2]), age ?? 0, age === null ? 0 : r.strength);
    });
    if (anyRipple(nowS)) state.invalidate();
  });

  return (
    <group ref={groupRef} position={center}>
      <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
      <Lanterns reflections={reflections} released={released} />
      {/* Cena leve: sem as carpas (nadam sem parar) */}
      {withKoi && !lite ? <Koi river={material.uniforms} released={released} /> : null}
      <RedThread released={released} />
    </group>
  );
}
