'use client';
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector3, Vector4 } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { groundHeight } from '../../lib/journey/ground';
import { NOISE, noiseDefines } from './glsl';
import { BONSAI, FESTIVAL, GROUND, IWAKURA, KATANA, KOMAINU, MOUNTAIN_LOOK, SHISHI_ODOSHI, TORII } from './config';
import { sceneLight, SCENE_LIGHT_PARS } from './lightRig';
import { lanternSpots } from './ShrineProps';
import { besideTorii } from './toriiFrame';
import { useCameraMap } from './useCameraMap';
import { detailTexture } from './detailTextures';
import { autumnWeight, winterWeight } from '../../lib/journey/math';

// Sombras de contato pintadas no chão (x, z, raio, força): cada peça pousa no terreno em vez de
// flutuar. Calculadas no shader do chão, sem malhas a mais
const MAX_SHADOWS = 24;
function contactShadows(toriiT) {
  const at = (right, ahead) => besideTorii(toriiT, right, ahead);
  const pillars = [-1, 1].map((s) => at(s * TORII.span / 2, 0));
  const komainu = [-1, 1].map((s) => at(s * KOMAINU.right, KOMAINU.ahead));
  const iwakura = at(IWAKURA.offset[0], IWAKURA.offset[1]);
  return [
    ...pillars.map(({ x, z }) => [x, z, 1.5, 0.55]),
    ...komainu.map(({ x, z }) => [x, z, 1.9, 0.5]),
    [iwakura.x, iwakura.z, 4.2, 0.5],
    [FESTIVAL.stall.x, FESTIVAL.stall.z, 2.8, 0.45],
    [BONSAI.x, BONSAI.z, 1.8, 0.45],
    [SHISHI_ODOSHI.x, SHISHI_ODOSHI.z, 1.4, 0.4],
    [KATANA.x, KATANA.z, 1.8, 0.4],
    ...lanternSpots().map(({ position: [x, , z] }) => [x, z, 1.3, 0.5]),
  ].slice(0, MAX_SHADOWS);
}

// Distância em que o chão atinge o tom "longe" (a mesma das camadas de montanha)
const FAR_DISTANCE = 60;

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uNear;
  uniform vec3 uMid;
  uniform vec3 uFar;
  uniform vec3 uCamera;
  uniform vec3 uMist;
  uniform float uMistStrength;
  uniform vec4 uShadows[${MAX_SHADOWS}];
  // Chão do Poly Haven por estação (só o tom): folhagem de floresta, folhas secas e neve
  uniform sampler2D uGroundTex;
  uniform sampler2D uLeavesTex;
  uniform sampler2D uSnowTex;
  uniform vec3 uSeasonWeights; // floresta, outono, inverno
  varying vec3 vWorld;
  ${NOISE}
  ${SCENE_LIGHT_PARS}

  void main() {
    // Terra do vale: mesmo tom das montanhas para a distância, com grão de pincel
    float t = clamp(distance(vWorld.xz, uCamera.xz) / ${FAR_DISTANCE.toFixed(1)}, 0.0, 1.0);
    vec3 ground = t < 0.5 ? mix(uNear, uMid, t * 2.0) : mix(uMid, uFar, (t - 0.5) * 2.0);
    float grain = fbm(vWorld.xz * vec2(0.35, 0.9));
    ground *= 0.92 + 0.14 * grain;
    // Relevo perto da câmera (de longe a repetição apareceria e a névoa cobre mesmo)
    vec2 tuv = vWorld.xz * 0.16;
    float tex = texture2D(uGroundTex, tuv).r * uSeasonWeights.x + texture2D(uLeavesTex, tuv * 1.2).r * uSeasonWeights.y + texture2D(uSnowTex, tuv * 0.8).r * uSeasonWeights.z;
    ground *= 1.0 + (tex - 0.5) * 0.7 * (1.0 - smoothstep(0.15, 0.55, t));
    // Sombras de contato das peças (antes da névoa: de longe somem junto com o chão)
    float shade = 1.0;
    for (int i = 0; i < ${MAX_SHADOWS}; i++) {
      vec4 s = uShadows[i];
      float d = distance(vWorld.xz, s.xy) / s.z;
      shade *= 1.0 - s.w * pow(clamp(1.0 - d, 0.0, 1.0), 1.6);
    }
    ground *= shade;
    // Névoa rasteira, como no pé das montanhas
    ground = mix(ground, uMist, uMistStrength * (0.55 + 0.25 * fbm(vWorld.xz * 0.05)));
    // Poças de luz das lanternas de pedra (depois da névoa: a luz atravessa ela)
    float pool = scenePools(vWorld, vec3(0.0, 1.0, 0.0)) * uPoolStrength;
    ground += (ground * 2.0 + 0.16) * uPoolColor * pool;

    vec3 col = ground;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// Malha do chão: plano subdividido com a altura de groundHeight em cada vértice
function buildGeometry() {
  const [width, depth] = GROUND.size;
  const [segX, segZ] = GROUND.segments;
  const geometry = new PlaneGeometry(width, depth, segX, segZ);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + GROUND.center[0];
    const z = pos.getZ(i) + GROUND.center[1];
    pos.setXYZ(i, x, groundHeight(x, z, GROUND), z);
  }
  geometry.computeBoundingSphere();
  return geometry;
}

// 地: chão do vale (a clareira do Stack agora tem os bambus de Tanabata, ver Tanabata.js)
export default function Ground() {
  const quality = useJourney((s) => s.quality);
  const geometry = useMemo(() => buildGeometry(), []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: noiseDefines(quality),
        fog: true,
        uniforms: UniformsUtils.merge([
          UniformsLib.fog,
          {
            uNear: { value: new Color() },
            uMid: { value: new Color() },
            uFar: { value: new Color() },
            uCamera: { value: new Vector3() },
            uMist: { value: new Color() },
            uMistStrength: { value: 0 },
            uShadows: { value: Array.from({ length: MAX_SHADOWS }, () => new Vector4(0, 0, 1, 0)) },
            uSeasonWeights: { value: new Vector3(1, 0, 0) },
          },
          sceneLight,
        ]),
      }),
    [quality],
  );
  // UniformsUtils.merge clona: as poças precisam dos objetos compartilhados (SceneLight atualiza), e
  // as texturas são holders que trocam o cinza neutro pela imagem quando ela carrega
  Object.assign(material.uniforms, sceneLight, {
    uGroundTex: detailTexture('ground'),
    uLeavesTex: detailTexture('leaves'),
    uSnowTex: detailTexture('snow'),
  });

  // Sombras de contato: dependem de onde o torii está (o mapa da câmera)
  const { params } = useCameraMap();
  useEffect(() => {
    const list = material.uniforms.uShadows.value;
    contactShadows(params.toriiT).forEach(([x, z, r, s], i) => list[i].set(x, z, r, s));
  }, [material, params.toriiT]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const scratch = useMemo(
    () => ({ target: new Color(), state: { initialized: false, mist: 0 } }),
    [],
  );

  useFrame((frame, delta) => {
    const { theme, seasonMix } = journeyStore.getState();
    const u = material.uniforms;
    const st = scratch.state;
    const k = st.initialized ? 1 - Math.exp(-delta * 6) : 1;
    st.initialized = true;
    let pending = false;

    const [near, mid, far] = sampleSeason(SEASONS[theme], seasonMix).mountains;
    for (const [uniform, hex] of [[u.uNear, near], [u.uMid, mid], [u.uFar, far]]) {
      scratch.target.set(hex);
      uniform.value.lerp(scratch.target, k);
      const c = uniform.value;
      if (Math.abs(c.r - scratch.target.r) + Math.abs(c.g - scratch.target.g) + Math.abs(c.b - scratch.target.b) > 0.002) pending = true;
    }
    if (frame.scene.fog) u.uMist.value.copy(frame.scene.fog.color);
    st.mist += (MOUNTAIN_LOOK[theme].mist - st.mist) * k;
    u.uMistStrength.value = st.mist;
    u.uCamera.value.copy(frame.camera.position);
    const autumn = autumnWeight(seasonMix);
    const winter = winterWeight(seasonMix);
    u.uSeasonWeights.value.set(Math.max(0, 1 - autumn - winter), autumn, winter);

    if (pending) frame.invalidate();
  });

  return <mesh geometry={geometry} material={material} />;
}
