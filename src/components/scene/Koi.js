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
import { revealWhenCompiled } from './warmup';
import { KOI } from './config';

const lerp = (a, b, t) => a + (b - a) * t;
// Variedades → tipo de desenho no shader (0 lisa metálica, 1 kohaku, 2 showa, 3 tanchō)
const PATTERN = { plain: 0, kohaku: 1, showa: 2, tancho: 3 };

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  attribute vec4 aSwim;
  attribute vec3 aTint;
  attribute vec2 aPattern;
  attribute float aPart;
  attribute vec2 aFin;
  uniform float uSwim;
  uniform vec3 uRiver;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vRiver;
  varying vec3 vTint;
  varying vec2 vPattern;
  varying vec2 vFin;
  varying float vPart;

  void main() {
    vec3 p = position;
    // aSwim: x = fase da batida (acumulada no JS, sem saltos quando a velocidade muda), y = fase
    // própria, z = força da batida, w = curva do corpo na virada
    // Nado: a onda corre da cabeça para a cauda (fase cresce com z), mais forte na ponta
    float along = clamp(0.5 - p.z, 0.0, 1.0);
    float wave = sin(aSwim.x + p.z * 6.0);
    p.x += wave * (0.01 + 0.11 * along * along) * aSwim.z;
    // Virando, o corpo inteiro se curva para o lado da curva
    p.x += aSwim.w * p.z * p.z;
    // Nadadeiras: a membrana ondula, parada na base e solta na ponta (vai atrás da batida)
    if (aPart > 0.5 && aPart < 1.5) {
      float flow = sin(aSwim.x * 0.8 + aFin.y * 3.0 - aFin.x * 3.5);
      p.y += flow * 0.03 * aFin.x * aFin.x * (0.6 + 0.4 * aSwim.z);
      // As peitorais remam: abrem e fecham devagar (e se recolhem um pouco na arrancada)
      if (aPart > 1.1) p.y += sin(uSwim * 3.2 + aSwim.y) * 0.04 * aFin.x;
    }
    vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
    // Refração: vista através da água, a silhueta balança um pouco
    world.xz += vec2(sin(uSwim * 1.7 + world.z * 2.3), cos(uSwim * 1.3 + world.x * 2.1)) * 0.018;
    vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vWorld = world.xyz;
    // Coordenadas do plano do rio (as mesmas do shader da água): x lateral, y rio acima
    vRiver = vec2(world.x - uRiver.x, -(world.z - uRiver.z));
    vLocal = position;
    vTint = aTint;
    vPattern = aPattern;
    vFin = aFin;
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
  varying vec3 vWorld;
  varying vec2 vRiver;
  varying vec3 vTint;
  varying vec2 vPattern;
  varying vec2 vFin;
  varying float vPart;
  ${NOISE}

  void main() {
    vec3 ink = vec3(0.035, 0.03, 0.04);
    float type = vPattern.x;
    float seed = vPattern.y;
    bool metallic = type < 0.5;
    vec3 col = vTint;
    float alpha = 0.9;
    float shine = metallic ? 0.75 : 0.4;
    float sparkle = 0.0;

    // Vermelho 緋 (hi) profundo, com variação de tom dentro da mancha
    vec2 q = vec2(vLocal.x * 6.5, vLocal.z * 3.6) + seed;
    vec3 red = mix(vec3(0.72, 0.07, 0.04), vec3(0.9, 0.22, 0.08), fbm(q * 2.3 + 3.0));

    if (vPart < 0.5) {
      // Manchas só no dorso. Borda nítida perto da cauda (kiwa) e esfumada na cabeça (sashi)
      float top = smoothstep(-0.035, 0.03, vLocal.y);
      float soft = mix(0.008, 0.045, smoothstep(-0.25, 0.35, vLocal.z));
      float n = fbm(q);
      if (type > 0.5 && type < 2.5) col = mix(col, red, smoothstep(0.5 - soft, 0.5 + soft, n) * top);
      if (type > 1.5 && type < 2.5) col = mix(col, ink, smoothstep(0.56, 0.6, fbm(q * 1.35 + 7.0)) * (0.35 + 0.65 * top));
      // Tanchō: só o círculo vermelho no alto da cabeça
      if (type > 2.5) col = mix(col, red, (1.0 - smoothstep(0.048, 0.06, length(vec2(vLocal.x, (vLocal.z - 0.31) * 1.1)))) * top);
      // Escamas: uma rede de arcos ao longo do corpo (mais marcada nas metálicas), sem escamas na cabeça
      float around = atan(vLocal.y / 0.68, vLocal.x);
      // Cada escama é um leque com a borda virada para a cauda; fileiras alternadas, como telhas
      vec2 cell = vec2(vLocal.z * 30.0, around * 7.0);
      cell.y += 0.5 * mod(floor(cell.x), 2.0);
      vec2 f = fract(cell);
      float r = length(vec2(f.x * 0.9, f.y - 0.5));
      float edge = smoothstep(0.38, 0.48, r) * (1.0 - smoothstep(0.5, 0.6, r));
      float zone = (1.0 - smoothstep(0.18, 0.28, vLocal.z)) * smoothstep(-0.44, -0.34, vLocal.z) * (0.35 + 0.65 * top);
      col *= 1.0 - edge * zone * (metallic ? 0.2 : 0.08);
      col += (1.0 - smoothstep(0.0, 0.4, r)) * zone * (metallic ? 0.06 : 0.02);
      // 銀鱗 gin-rin: algumas escamas pegam a luz e cintilam (mais nas metálicas)
      float h = fract(sin(dot(floor(cell) + seed, vec2(12.9898, 78.233))) * 43758.5453);
      float glint = step(metallic ? 0.72 : 0.9, h) * (1.0 - smoothstep(0.0, 0.32, r)) * zone * top;
      sparkle = glint * (0.5 + 0.5 * sin(uTime * 2.5 + h * 40.0));
      // Opérculo: a linha curva da guelra atrás da cabeça
      float gill = abs(vLocal.z - 0.27 + 0.9 * vLocal.y * vLocal.y);
      col *= 1.0 - (1.0 - smoothstep(0.0, 0.007, gill)) * 0.22 * smoothstep(0.02, 0.06, abs(vLocal.x));
      // A cabeça é lisa e um pouco mais brilhante
      shine += smoothstep(0.26, 0.34, vLocal.z) * 0.25;
      // Barriga um pouco mais clara
      col = mix(col, vec3(0.97, 0.95, 0.9), (1.0 - top) * 0.18);
    } else if (vPart < 1.5) {
      // Nadadeiras: véu translúcido, quase invisível na ponta, com os raios marcados
      col = mix(vTint, vec3(1.0, 0.98, 0.95), metallic ? 0.15 : 0.35);
      // Showa: a base das peitorais em preto (motoguro)
      if (vPart > 1.1 && type > 1.5 && type < 2.5) col = mix(col, ink, 1.0 - smoothstep(0.15, 0.45, vFin.x));
      // Kohaku com um toque de vermelho na base da cauda e da dorsal
      if (vPart < 1.1 && type > 0.5 && type < 1.5) col = mix(col, red, (1.0 - smoothstep(0.0, 0.3, vFin.x)) * 0.6);
      float rays = 0.5 + 0.5 * cos(vFin.y * 6.2832 * 9.0);
      col *= 1.0 - rays * 0.18 * smoothstep(0.1, 0.5, vFin.x);
      alpha = mix(0.82, 0.08, pow(vFin.x, 1.4));
      // A borda da membrana pega a luz (contorno claro e fino)
      col += smoothstep(0.86, 0.98, vFin.x) * 0.12;
      shine = 0.25;
    } else if (vPart < 2.5) {
      // Olho: pupila negra, íris dourada estreita e o globo escuro em volta
      float d = vFin.x;
      col = mix(ink, vec3(0.74, 0.52, 0.2), smoothstep(0.4, 0.46, d));
      col = mix(col, vTint * 0.8, smoothstep(0.62, 0.85, d));
      alpha = 1.0;
      shine = 1.6;
    } else {
      col = mix(vTint, vec3(0.75, 0.6, 0.5), 0.3) * 0.9;
    }

    // Luz suave de cima e o reflexo molhado (especular) que se move com a câmera
    vec3 nrm = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 L = normalize(vec3(-0.3, 1.0, 0.4));
    vec3 V = normalize(cameraPosition - vWorld);
    float light = 0.55 + 0.45 * max(dot(nrm, L), 0.0);
    col *= light;
    float spec = pow(max(dot(nrm, normalize(L + V)), 0.0), vPart > 1.5 && vPart < 2.5 ? 90.0 : 36.0);
    float rim = pow(1.0 - max(dot(nrm, V), 0.0), 3.0);
    // Brilho perolado: o reflexo puxa para o rosa/azul conforme o ângulo
    vec3 pearl = mix(vec3(1.0, 0.92, 0.96), vec3(0.88, 0.95, 1.0), rim);
    col += pearl * (spec * shine + rim * 0.12 * shine);
    col += pearl * sparkle * pow(max(dot(nrm, V), 0.0), 2.0) * 0.55;
    // Contra a luz, a nadadeira fica translúcida e acende
    if (vPart > 0.5 && vPart < 1.5) col += vTint * pow(max(dot(-V, L), 0.0), 3.0) * 0.25;
    // Cáusticas: a rede de luz que a superfície ondulada projeta no dorso
    float caus = pow(1.0 - abs(fbm(vec2(vWorld.x * 2.4, vWorld.z * 2.4) + uTime * 0.35) * 2.0 - 1.0), 6.0);
    col += caus * 0.16 * max(nrm.y, 0.0) * (vPart < 1.5 ? 1.0 : 0.0);
    if (metallic && vPart < 0.5) col += vTint * pow(max(nrm.y, 0.0), 6.0) * 0.18;
    col *= uBright;

    // Debaixo d'água: a cor da água por cima e as linhas de brilho das marolas passando sobre o corpo
    col = mix(col, uWater, uSubmerge);
    float lines = smoothstep(0.64, 0.72, fbm(vec2(vRiver.x * 0.22, vRiver.y * 3.2 - uTime * 0.6)));
    col = mix(col, uSky, lines * 0.3);
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
      // Suavizados: força do nado, arrancada (1 passeando, KOI.dash atrás do cursor), fase da
      // batida e a curva do corpo
      drive: 0.5,
      boost: 1,
      beat: rand() * Math.PI * 2,
      bend: 0,
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
    g.setAttribute('aSwim', new InstancedBufferAttribute(new Float32Array(n * 4), 4));
    return g;
  }, [school]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Montadas depois da cena (ver River): o shader compila em paralelo, sem travar a página
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  // Escondidas até o shader compilar: desenhar antes faria a página esperar a compilação (travada)
  useEffect(() => {
    if (meshRef.current) revealWhenCompiled(gl, meshRef.current, camera, scene);
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
        // Atrás do cursor ou da lanterna elas apressam o nado (e viram mais rápido). A arrancada
        // cresce e some aos poucos: sem trancos quando uma carpa entra ou sai das curiosas
        const excited = Boolean(lantern) || Boolean(curious?.has(k));
        k.boost += ((excited ? KOI.dash : 1) - k.boost) * (1 - Math.exp(-dt * 1.8));
        // As vizinhas desviam o rumo (em vez de empurrar de lado, que faz a carpa deslizar)
        const [px, pz] = separation(k, school, KOI.spacing);
        const goal = { x: target.x + px * 1.5, z: target.z + pz * 1.5 };
        const swimmer = { ...k, speed: k.speed * k.boost };
        const turn = KOI.turn * (1 + (k.boost - 1) * 0.6);
        const before = k.heading;
        const next = swimStep(swimmer, goal, dt, { zone: KOI.zone, turn, slowRadius: KOI.slowRadius });
        Object.assign(k, next, { speed: k.speed, x: next.x + px * dt * 0.2, z: next.z + pz * dt * 0.2 });
        // Batida: mais rápida e mais forte quanto mais depressa ela nada
        const ease = 1 - Math.exp(-dt * 3);
        k.drive += (next.effort * k.boost - k.drive) * ease;
        k.beat += dt * (3.5 + 3.8 * k.drive);
        const rate = dt > 0 ? (next.heading - before) / dt : 0;
        k.bend += (Math.max(-0.5, Math.min(0.5, rate * 0.22)) - k.bend) * ease;
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
      swim.setXYZW(i, k.beat, k.phase, 0.45 + 0.45 * Math.min(k.drive, 1.6), k.bend);
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
      visible={false}
    />
  );
}
