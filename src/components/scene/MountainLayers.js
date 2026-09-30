'use client';
import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color, ConeGeometry, DataTexture, LinearFilter, MeshBasicMaterial, Object3D, RGBAFormat, Shape, ShapeGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { journeyStore, useJourney } from '../../store/journey';
import { SEASONS, SCENE_ACCENTS } from '../../lib/palette';
import { sampleSeason, clamp01 } from '../../lib/journey/season';
import { ridgePoints } from '../../lib/journey/ridge';
import { ridgeProfile, forestPlacements } from '../../lib/journey/landscape';
import { NOISE, noiseDefines } from './glsl';
import { MOUNTAIN_LAYERS, MOUNTAIN_LOOK, FOREST } from './config';

// Distância em que a camada atinge o tom "longe"
const FAR_DISTANCE = 60;

function buildGeometry(layer, points) {
  const shape = new Shape();
  shape.moveTo(points[0][0], layer.bottom);
  points.forEach(([x, y]) => shape.lineTo(x, y));
  shape.lineTo(points[points.length - 1][0], layer.bottom);
  shape.closePath();
  return new ShapeGeometry(shape);
}

// Cume em textura 1D: o fragment shader sabe a que distância do topo está (borda iluminada)
function ridgeTexture(points) {
  const { values, min, max } = ridgeProfile(points);
  const data = new Uint8Array(values.length * 4);
  values.forEach((v, i) => {
    data[i * 4] = Math.round(v * 255);
    data[i * 4 + 3] = 255;
  });
  const texture = new DataTexture(data, values.length, 1, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return { texture, min, max };
}

// Sugi (杉): dois cones empilhados, low-poly, com a base na origem
function sugiGeometry() {
  const lower = new ConeGeometry(0.42, 1.0, 5);
  lower.translate(0, 0.5, 0);
  const upper = new ConeGeometry(0.3, 0.8, 5);
  upper.translate(0, 1.05, 0);
  const merged = mergeGeometries([lower.toNonIndexed(), upper.toNonIndexed()]);
  lower.dispose();
  upper.dispose();
  return merged;
}

const VERTEX_HEAD = /* glsl */ `
  varying vec3 vWorld;
`;
const VERTEX_BODY = /* glsl */ `
  #include <begin_vertex>
  #ifdef USE_INSTANCING
    vWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
    vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif
`;

const FRAGMENT_HEAD = /* glsl */ `
  uniform sampler2D uRidge;
  uniform vec2 uRidgeRange;
  uniform float uHalfWidth;
  uniform float uRidgeCount;
  uniform vec3 uMist;
  uniform vec2 uMistBand;
  uniform float uMistStrength;
  uniform vec3 uRim;
  uniform float uRimStrength;
  uniform float uSeed;
  uniform float uTime;
  varying vec3 vWorld;
  ${NOISE}
`;

// Ukiyo-e: textura de pincel, borda clara no cume (luar/sol rasante) e névoa subindo do pé
const FRAGMENT_BODY = /* glsl */ `
  vec3 base = diffuse;
  float u = ((vWorld.x + uHalfWidth) / (2.0 * uHalfWidth) * (uRidgeCount - 1.0) + 0.5) / uRidgeCount;
  float ridgeY = mix(uRidgeRange.x, uRidgeRange.y, texture2D(uRidge, vec2(u, 0.5)).r);
  float depth = ridgeY - vWorld.y;

  // Pinceladas: grão alongado na horizontal + manchas largas de tinta mais densa
  float grain = fbm(vec2(vWorld.x * 0.45, vWorld.y * 2.4) + uSeed);
  float wash = fbm(vec2(vWorld.x * 0.06, depth * 0.35) + uSeed * 1.7);
  base *= 0.93 + 0.1 * grain + 0.12 * (wash - 0.5);

  // Névoa do pé da montanha, respirando devagar
  float mist = 1.0 - smoothstep(uMistBand.x, uMistBand.y, vWorld.y);
  mist *= 0.8 + 0.2 * fbm(vec2(vWorld.x * 0.1 + uTime * 0.03, vWorld.y * 0.4 + uSeed));
  base = mix(base, uMist, clamp(mist, 0.0, 1.0) * uMistStrength);

  // Borda do cume em espessura de tela (~2px perto ou longe), só na encosta e não nas árvores
  float px = fwidth(vWorld.y);
  float rim = (1.0 - smoothstep(0.0, px * 2.2 + 0.01, depth)) * step(-0.02, depth);
  base = mix(base, uRim, rim * uRimStrength);

  vec4 diffuseColor = vec4(base, opacity);
`;

function createMaterial(layer, ridge, index, quality) {
  const material = new MeshBasicMaterial();
  material.defines = noiseDefines(quality);
  const uniforms = {
    uRidge: { value: ridge.texture },
    uRidgeRange: { value: [ridge.min, ridge.max] },
    uHalfWidth: { value: layer.width / 2 },
    uRidgeCount: { value: layer.segments + 1 },
    uMist: { value: new Color() },
    uMistBand: { value: [layer.baseHeight - MOUNTAIN_LOOK.mistDepth, layer.baseHeight + layer.amplitude * MOUNTAIN_LOOK.mistReach] },
    uMistStrength: { value: 0 },
    uRim: { value: new Color() },
    uRimStrength: { value: 0 },
    uSeed: { value: index * 13.7 },
    uTime: { value: 0 },
  };
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = VERTEX_HEAD + shader.vertexShader.replace('#include <begin_vertex>', VERTEX_BODY);
    shader.fragmentShader = FRAGMENT_HEAD + shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', FRAGMENT_BODY);
  };
  return material;
}

// Silhuetas em camadas; o tom vai de "perto" a "longe" conforme a distância da câmera.
// Cada camada tem sua floresta de sugi, com o mesmo material para a silhueta fundir
export default function MountainLayers() {
  const quality = useJourney((s) => s.quality);

  const layers = useMemo(
    () =>
      MOUNTAIN_LAYERS.map((layer) => {
        const points = ridgePoints(layer);
        return { layer, points, geometry: buildGeometry(layer, points), ridge: ridgeTexture(points) };
      }),
    [],
  );

  const materials = useMemo(
    () => layers.map(({ layer, ridge }, i) => createMaterial(layer, ridge, i, quality)),
    [layers, quality],
  );

  const sugi = useMemo(() => sugiGeometry(), []);
  const forests = useMemo(() => {
    const count = FOREST.count[quality] ?? FOREST.count.low;
    return layers.map(({ layer, points }, i) =>
      forestPlacements(points, { seed: layer.seed + 5, count, halfWidth: FOREST.halfWidth, valleyHalf: FOREST.valleyHalf })
        .map(([x, y, s]) => [x, y, s * (1 + i * FOREST.growWithDistance)]),
    );
  }, [layers, quality]);

  useEffect(
    () => () => {
      layers.forEach(({ geometry, ridge }) => {
        geometry.dispose();
        ridge.texture.dispose();
      });
      sugi.dispose();
    },
    [layers, sugi],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  const tones = useMemo(
    () => ({ near: new Color(), mid: new Color(), far: new Color(), target: new Color(), rim: new Color() }),
    [],
  );
  const state = useMemo(() => ({ initialized: false, rimStrength: 0, mist: 0 }), []);

  useFrame((frame, delta) => {
    const { theme, seasonMix } = journeyStore.getState();
    const [near, mid, far] = sampleSeason(SEASONS[theme], seasonMix).mountains;
    tones.near.set(near);
    tones.mid.set(mid);
    tones.far.set(far);
    // Primeiro frame aplica a cor direto (sem piscar branco); depois amortece
    const k = state.initialized ? 1 - Math.exp(-delta * 6) : 1;
    state.initialized = true;
    const look = MOUNTAIN_LOOK[theme];
    state.rimStrength += (look.rim - state.rimStrength) * k;
    state.mist += (look.mist - state.mist) * k;
    const fog = frame.scene.fog?.color;
    let pending = false;

    MOUNTAIN_LAYERS.forEach((layer, i) => {
      const material = materials[i];
      const t = clamp01(Math.abs(frame.camera.position.z - layer.z) / FAR_DISTANCE);
      if (t < 0.5) tones.target.copy(tones.near).lerp(tones.mid, t * 2);
      else tones.target.copy(tones.mid).lerp(tones.far, (t - 0.5) * 2);
      material.color.lerp(tones.target, k);
      const c = material.color;
      if (Math.abs(c.r - tones.target.r) + Math.abs(c.g - tones.target.g) + Math.abs(c.b - tones.target.b) > 0.002) {
        pending = true;
      }

      const u = material.userData.uniforms;
      if (fog) u.uMist.value.copy(fog);
      // Borda: o próprio tom da camada puxado para a luz do céu (lua/sol)
      tones.rim.set(SCENE_ACCENTS[theme].celestial);
      u.uRim.value.copy(c).lerp(tones.rim, look.rimTint);
      u.uRimStrength.value = state.rimStrength;
      u.uMistStrength.value = state.mist;
      u.uTime.value = frame.clock.elapsedTime;
    });

    if (pending) frame.invalidate();
  });

  return layers.map(({ layer, geometry }, i) => (
    <group key={layer.seed} position={[layer.x, 0, layer.z]}>
      <mesh geometry={geometry} material={materials[i]} />
      <Forest geometry={sugi} material={materials[i]} trees={forests[i]} />
    </group>
  ));
}

const dummy = new Object3D();

function Forest({ geometry, material, trees }) {
  const ref = (mesh) => {
    if (!mesh) return;
    trees.forEach(([x, y, s], i) => {
      dummy.position.set(x, y, 0);
      // Um pouco mais estreita que alta: sugi é esguio
      dummy.scale.set(s * 0.8, s, s * 0.8);
      dummy.rotation.set(0, (i * 1.7) % Math.PI, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  };
  if (!trees.length) return null;
  return <instancedMesh key={trees.length} ref={ref} args={[geometry, material, trees.length]} />;
}
