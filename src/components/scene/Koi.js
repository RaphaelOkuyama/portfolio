'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Color, DoubleSide, InstancedBufferAttribute, Object3D, Plane, Raycaster, ShaderMaterial, UniformsLib, UniformsUtils,
  Vector2, Vector3,
} from 'three';
import { journeyStore } from '../../store/journey';
import { mulberry32 } from '../../lib/journey/ridge';
import { clampToZone, insideZone, orbitPoint, separation, swimStep } from '../../lib/journey/koi';
import { pointer } from '../../lib/pointer';
import { NOISE, noiseDefines } from './glsl';
import { koiGeometry } from './koiGeometry';
import { KOI } from './config';

const lerp = (a, b, t) => a + (b - a) * t;
// Variedades → tipo de desenho no shader (0 lisa metálica, 1 kohaku, 2 showa, 3 tanchō)
const PATTERN = { plain: 0, kohaku: 1, showa: 2, tancho: 3 };

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  attribute vec3 aSwim;
  attribute vec3 aTint;
  attribute vec2 aPattern;
  attribute float aPart;
  uniform float uSwim;
  uniform vec3 uRiver;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec2 vRiver;
  varying vec3 vTint;
  varying vec2 vPattern;
  varying float vPart;

  void main() {
    vec3 p = position;
    // Nado: onda da cabeça para a cauda, mais forte na ponta e quando ela acelera (aSwim.z)
    float along = clamp(0.5 - p.z, 0.0, 1.0);
    float wave = sin(uSwim * 7.0 * aSwim.y + aSwim.x - p.z * 6.0);
    p.x += wave * (0.012 + 0.11 * along * along) * aSwim.z;
    // As peitorais remam devagar
    if (aPart > 0.5 && aPart < 1.5 && p.z > 0.0) p.y += sin(uSwim * 4.0 + aSwim.x) * 0.05 * abs(p.x);
    vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
    // Refração: vista através da água, a silhueta balança um pouco
    world.xz += vec2(sin(uSwim * 1.7 + world.z * 2.3), cos(uSwim * 1.3 + world.x * 2.1)) * 0.018;
    vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    // Coordenadas do plano do rio (as mesmas do shader da água): x lateral, y rio acima
    vRiver = vec2(world.x - uRiver.x, -(world.z - uRiver.z));
    vLocal = position;
    vTint = aTint;
    vPattern = aPattern;
    vPart = aPart;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 uWater;
  uniform vec3 uSky;
  uniform float uTime;
  uniform float uBright;
  uniform float uSubmerge;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec2 vRiver;
  varying vec3 vTint;
  varying vec2 vPattern;
  varying float vPart;
  ${NOISE}

  void main() {
    vec3 red = vec3(0.86, 0.2, 0.09);
    vec3 ink = vec3(0.06, 0.055, 0.065);
    float type = vPattern.x;
    float seed = vPattern.y;
    vec3 col = vTint;
    if (vPart < 0.5) {
      // Manchas só no dorso, com borda orgânica (ruído), como numa koi de verdade
      float top = smoothstep(-0.03, 0.04, vLocal.y);
      vec2 q = vec2(vLocal.x * 6.5, vLocal.z * 3.6) + seed;
      float n = fbm(q);
      if (type > 0.5 && type < 2.5) col = mix(col, red, smoothstep(0.49, 0.53, n) * top);
      if (type > 1.5 && type < 2.5) col = mix(col, ink, smoothstep(0.57, 0.6, fbm(q * 1.35 + 7.0)) * (0.35 + 0.65 * top));
      // Tanchō: só o círculo vermelho na cabeça
      if (type > 2.5) col = mix(col, red, (1.0 - smoothstep(0.05, 0.06, length(vec2(vLocal.x, (vLocal.z - 0.33) * 1.15)))) * top);
    } else if (vPart < 1.5) {
      col = mix(vTint, vec3(1.0), 0.4);
    } else {
      col = ink;
    }
    // Luz suave de cima (sombreado liso) e o brilho metálico das lisas (ogon, platina)
    vec3 nrm = normalize(vNormalW);
    float light = 0.58 + 0.42 * max(dot(nrm, normalize(vec3(-0.3, 1.0, 0.4))), 0.0);
    col *= light;
    if (type < 0.5 && vPart < 0.5) col += pow(max(nrm.y, 0.0), 8.0) * 0.22;
    col *= uBright;

    // Debaixo d'água: a cor da água por cima e as linhas de brilho das marolas passando sobre o corpo
    col = mix(col, uWater, uSubmerge);
    float lines = smoothstep(0.64, 0.72, fbm(vec2(vRiver.x * 0.22, vRiver.y * 3.2 - uTime * 0.6)));
    col = mix(col, uSky, lines * 0.3);
    float alpha = vPart > 0.5 && vPart < 1.5 ? 0.45 : 0.84;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// Material das carpas: compartilha com a água a cor, o reflexo do céu e o relógio das marolas
function koiMaterial(river) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    defines: noiseDefines('low'),
    transparent: true,
    side: DoubleSide,
    fog: true,
    uniforms: {
      ...UniformsUtils.merge([UniformsLib.fog, {
        uSwim: { value: 0 },
        uBright: { value: 1 },
        uSubmerge: { value: KOI.submerge },
        uRiver: { value: new Vector3() },
      }]),
      uWater: river.uWater,
      uSky: river.uSky,
      uTime: river.uTime,
    },
  });
}

// Carpas no rio do contato: passeiam, vêm até o cursor sobre a água e seguem a lanterna solta
export default function Koi({ river, released }) {
  const meshRef = useRef(null);
  const material = useMemo(() => koiMaterial(river), [river]);
  useEffect(() => () => material.dispose(), [material]);

  // Cardume: posição inicial espalhada na zona, rumo e velocidade próprios
  const school = useMemo(() => {
    const rand = mulberry32(1031);
    const { x: [x0, x1], z: [z0, z1] } = KOI.zone;
    return KOI.school.map((k) => ({
      ...k,
      x: lerp(x0, x1, rand()),
      z: lerp(z0, z1, rand()),
      heading: rand() * Math.PI * 2,
      speed: lerp(KOI.speed[0], KOI.speed[1], rand()),
      phase: rand() * Math.PI * 2,
      seed: rand() * 40,
      effort: 0.5,
      wander: null,
      wanderUntil: 0,
      rand,
    }));
  }, []);

  // Uma geometria para todas: o desenho de cada uma vem dos atributos de instância
  const geometry = useMemo(() => {
    const g = koiGeometry().clone();
    const n = school.length;
    const tint = new Float32Array(n * 3);
    const pattern = new Float32Array(n * 2);
    const color = new Color();
    school.forEach((k, i) => {
      color.set(k.tint).toArray(tint, i * 3);
      pattern[i * 2] = PATTERN[k.variant] ?? 1;
      pattern[i * 2 + 1] = k.seed;
    });
    g.setAttribute('aTint', new InstancedBufferAttribute(tint, 3));
    g.setAttribute('aPattern', new InstancedBufferAttribute(pattern, 2));
    g.setAttribute('aSwim', new InstancedBufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [school]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Montadas depois da cena (ver River): o shader compila em paralelo, sem travar a página
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    if (meshRef.current) gl.compileAsync(meshRef.current, camera, scene).catch(() => {});
  }, [gl, camera, scene]);

  const dummy = useMemo(() => new Object3D(), []);
  const ray = useMemo(() => ({
    caster: new Raycaster(), ndc: new Vector2(), plane: new Plane(new Vector3(0, 1, 0), 0), hit: new Vector3(), origin: new Vector3(),
  }), []);
  const clock = useRef(0);
  // As lanternas marcam a hora da soltura neste relógio (que para com movimento reduzido)
  useEffect(() => {
    released.clock = () => clock.current;
    return () => { delete released.clock; };
  }, [released]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    // Rio escondido (antes do fim da jornada ou fora da home): nada a fazer
    if (!mesh || !mesh.parent?.visible) return;
    const journey = journeyStore.getState();
    const moving = !journey.reducedMotion;
    const dt = Math.min(delta, 1 / 20);
    if (moving) clock.current += dt;
    const t = clock.current;
    const u = material.uniforms;
    u.uSwim.value = t;
    u.uBright.value = lerp(u.uBright.value, KOI.brightness[journey.theme], 1 - Math.exp(-delta * 4));
    mesh.parent.getWorldPosition(ray.origin);
    u.uRiver.value.copy(ray.origin);

    // Cursor sobre a água: o raio da câmera até o plano do rio, nas coordenadas do rio
    let lure = null;
    if (pointer.active) {
      ray.plane.constant = -ray.origin.y;
      ray.caster.setFromCamera(ray.ndc.set(pointer.x, pointer.y), state.camera);
      if (ray.caster.ray.intersectPlane(ray.plane, ray.hit)) {
        const x = ray.hit.x - ray.origin.x;
        const z = ray.hit.z - ray.origin.z;
        const m = KOI.lureMargin;
        const wide = { x: [KOI.zone.x[0] - m, KOI.zone.x[1] + m], z: [KOI.zone.z[0] - m, KOI.zone.z[1] + m] };
        if (insideZone(x, z, wide)) lure = clampToZone(x, z, KOI.zone);
      }
    }
    // Lanterna solta pelo formulário: o cardume inteiro acompanha enquanto ela desce o rio
    const lantern = released.item && t - released.at < KOI.followLantern ? { x: released.item.x, z: released.item.z } : null;
    // As mais próximas do cursor são as curiosas
    const curious = lure
      ? new Set([...school].sort((a, b) => Math.hypot(a.x - lure.x, a.z - lure.z) - Math.hypot(b.x - lure.x, b.z - lure.z)).slice(0, KOI.curious))
      : null;

    if (moving) {
      school.forEach((k, i) => {
        let target;
        if (lantern) target = orbitPoint(lantern, i, school.length, t, KOI.orbit.lantern);
        else if (curious?.has(k)) target = orbitPoint(lure, i, KOI.curious, t, KOI.orbit.pointer);
        else {
          // Passeio: um ponto ao acaso na zona, trocado ao chegar ou de tempos em tempos
          if (!k.wander || t > k.wanderUntil || Math.hypot(k.x - k.wander.x, k.z - k.wander.z) < 0.6) {
            k.wander = { x: lerp(KOI.zone.x[0], KOI.zone.x[1], k.rand()), z: lerp(KOI.zone.z[0], KOI.zone.z[1], k.rand()) };
            k.wanderUntil = t + 8 + k.rand() * 7;
          }
          target = k.wander;
        }
        // Atrás do cursor ou da lanterna elas apressam o nado (e viram mais rápido)
        const excited = Boolean(lantern) || Boolean(curious?.has(k));
        const swimmer = excited ? { ...k, speed: k.speed * KOI.dash } : k;
        const next = swimStep(swimmer, target, dt, { zone: KOI.zone, turn: KOI.turn * (excited ? 1.6 : 1), slowRadius: KOI.slowRadius });
        const [px, pz] = separation(k, school, KOI.spacing);
        Object.assign(k, next, { speed: k.speed, x: next.x + px * dt, z: next.z + pz * dt });
      });
    }

    const swim = geometry.attributes.aSwim;
    school.forEach((k, i) => {
      // Cada uma numa profundidade um pouco diferente, subindo e descendo devagar
      dummy.position.set(k.x, KOI.y - (i % 3) * 0.06 + Math.sin(t * 0.6 + k.phase) * 0.02, k.z);
      dummy.rotation.set(0, k.heading, 0);
      dummy.scale.setScalar(k.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      swim.setXYZ(i, k.phase, 0.7 + 0.6 * k.effort, 0.5 + 0.8 * k.effort);
    });
    mesh.instanceMatrix.needsUpdate = true;
    swim.needsUpdate = true;
  });

  // frustumCulled: a esfera de colisão é a da geometria na origem, não a das carpas espalhadas.
  // renderOrder: depois da água (que é transparente), para aparecerem sob a superfície
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, school.length]}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
