'use client';
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, PlaneGeometry, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { groundHeight } from '../../lib/journey/ground';
import { NOISE, noiseDefines } from './glsl';
import { GROUND, MOUNTAIN_LOOK } from './config';

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
  varying vec3 vWorld;
  ${NOISE}

  void main() {
    // Terra do vale: mesmo tom das montanhas para a distância, com grão de pincel
    float t = clamp(distance(vWorld.xz, uCamera.xz) / ${FAR_DISTANCE.toFixed(1)}, 0.0, 1.0);
    vec3 ground = t < 0.5 ? mix(uNear, uMid, t * 2.0) : mix(uMid, uFar, (t - 0.5) * 2.0);
    float grain = fbm(vWorld.xz * vec2(0.35, 0.9));
    ground *= 0.92 + 0.14 * grain;
    // Névoa rasteira, como no pé das montanhas
    ground = mix(ground, uMist, uMistStrength * (0.55 + 0.25 * fbm(vWorld.xz * 0.05)));

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
          },
        ]),
      }),
    [quality],
  );
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

    if (pending) frame.invalidate();
  });

  return <mesh geometry={geometry} material={material} />;
}
