'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { insideCircle, isSceneClick, projectSphere } from '../../lib/journey/sceneClick';
import { useAccentMaterials } from './useAccentMaterials';
import { kodamaGeometry } from './shrineGeometry';
import { getCameraCurve } from './useCameraMap';
import { GROUND, KODAMA_HUNT } from './config';

// 木霊探し: cinco kodama escondidos pela jornada. Clicar num deles: a cabeça chacoalha (o estalo),
// ele brilha verde e se desfaz em luzinhas que sobem, com um sino. Os achados ficam guardados no
// navegador; achar os cinco acende 木霊の森, a floresta dos espíritos: luzes verdes flutuando pela
// cena inteira, como os espíritos das florestas do Ghibli. Tudo aqui é barato: cinco malhas
// pequenas e, só quando acesa, uma nuvem de pontos
export const KODAMA_KEY = 'oku-kodama';
export const SPIRIT_KEY = 'oku-spirit';

const readFound = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KODAMA_KEY) ?? '[]');
    return Array.isArray(list) ? list.filter((i) => Number.isInteger(i)) : [];
  } catch {
    return [];
  }
};

// Um sininho de vento (風鈴) curto: dois parciais agudos que somem
function chime(index) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const at = ctx.currentTime + 0.01;
    const base = [1318, 1568, 1760, 2093, 2349][index % 5];
    [1, 2.76].forEach((m, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = base * m;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(i ? 0.03 : 0.08, at + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + (i ? 0.6 : 1.4));
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 1.5);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1800);
  } catch {
    // Sem áudio: o kodama some em silêncio
  }
}

const sparkVertex = /* glsl */ `
  attribute float aLife;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (4.0 + aLife * 8.0) * (18.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const sparkFragment = /* glsl */ `
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5 || vLife < 0.01) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vec3(0.62, 1.0, 0.62) * (0.6 + glow), glow * vLife);
  }
`;

// Luzes dos espíritos: bolinhas verdes que sobem e descem devagar, piscando, ao longo do caminho
const spiritVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec3 aSeed;
  varying float vTwinkle;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * (0.4 + aSeed.x * 0.5) + aSeed.y * 6.28) * 0.6 + mod(uTime * (0.08 + aSeed.z * 0.1) + aSeed.y * 5.0, 5.0);
    p.x += sin(uTime * 0.3 + aSeed.z * 9.0) * 0.5;
    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.5 + aSeed.x * 2.0) + aSeed.z * 20.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(170.0 / -mv.z, 4.0, 30.0) * uPixelRatio;
  }
`;
const spiritFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    if (glow < 0.01) discard;
    // Verde saturado com o miolo claro: aparece contra a névoa clara do dia e brilha à noite
    float core = smoothstep(0.22, 0.0, d);
    vec3 col = mix(vec3(0.16, 0.78, 0.32), vec3(0.88, 1.0, 0.84), core);
    gl_FragColor = vec4(col, (glow * 0.75 + core * 0.4) * vTwinkle * uOpacity);
  }
`;

function SpiritLights() {
  const dpr = useThree((s) => s.viewport.dpr);
  const lights = useMemo(() => {
    const n = KODAMA_HUNT.spirits;
    const curve = getCameraCurve();
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 3);
    const at = new Vector3();
    for (let i = 0; i < n; i += 1) {
      // Espalhadas em volta do caminho da câmera, dos dois lados, perto do chão
      curve.getPointAt(Math.random(), at);
      const side = (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 8);
      const x = at.x + side;
      const z = at.z - 4 - Math.random() * 10;
      pos.set([x, groundHeight(x, z, GROUND) + 0.4 + Math.random() * 2.4, z], i * 3);
      seed.set([Math.random(), Math.random(), Math.random()], i * 3);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(pos, 3));
    geometry.setAttribute('aSeed', new BufferAttribute(seed, 3));
    const material = new ShaderMaterial({
      vertexShader: spiritVertex,
      fragmentShader: spiritFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: dpr }, uOpacity: { value: 0 } },
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    return { geometry, material, points };
  }, [dpr]);
  useEffect(() => () => { lights.geometry.dispose(); lights.material.dispose(); }, [lights]);

  useFrame((state, delta) => {
    const u = lights.material.uniforms;
    u.uTime.value += delta;
    // Acende devagar (e apaga) com a floresta
    const target = journeyStore.getState().spirit ? 1 : 0;
    u.uOpacity.value += (target - u.uOpacity.value) * Math.min(1, delta * 1.5);
    lights.points.visible = u.uOpacity.value > 0.01;
    if (lights.points.visible) state.invalidate();
  });
  return <primitive object={lights.points} />;
}

export default function KodamaHunt() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const spirit = useJourney((s) => s.spirit);
  const materials = useAccentMaterials({ body: { accent: 'kodama' }, face: { accent: 'toriiTop' } });
  const { body, head, face } = kodamaGeometry();
  const [found, setFound] = useState([]);
  const leaving = useRef(new Map());
  const groups = useRef([]);
  const heads = useRef([]);
  const scratch = useMemo(() => [new Vector3(), new Vector3()], []);

  const spots = useMemo(() => KODAMA_HUNT.spots.map(([x, z, turn]) => {
    const y = groundHeight(x, z, GROUND);
    return { position: [x, y, z], center: new Vector3(x, y + 0.45 * KODAMA_HUNT.scale, z), rotationY: turn };
  }), []);

  // Achados de visitas anteriores; a floresta volta acesa se já foi liberada
  useEffect(() => {
    setFound(readFound());
    try {
      if (localStorage.getItem(SPIRIT_KEY) === '1') journeyStore.getState().setSpirit(true);
    } catch {
      // Storage bloqueado: a caça recomeça a cada visita
    }
  }, []);

  // Clique num kodama visível
  useEffect(() => {
    const onClick = (e) => {
      if (!isSceneClick(e.target)) return;
      spots.forEach((s, i) => {
        if (found.includes(i) || leaving.current.has(i)) return;
        const hit = projectSphere(s.center, 0.55 * KODAMA_HUNT.scale, camera, size.width, size.height, scratch);
        if (!hit) return;
        const r = Math.max(hit.r, KODAMA_HUNT.minHit);
        if (!insideCircle(e.clientX, e.clientY, hit.x, hit.y, r)) return;
        leaving.current.set(i, performance.now() / 1000);
        chime(found.length);
        const next = [...found, i];
        setTimeout(() => {
          setFound(next);
          try {
            localStorage.setItem(KODAMA_KEY, JSON.stringify(next));
          } catch {
            // Storage bloqueado
          }
          window.dispatchEvent(new CustomEvent('kodama-found', { detail: { count: next.length, total: spots.length } }));
          if (next.length >= spots.length) {
            try {
              localStorage.setItem(SPIRIT_KEY, '1');
            } catch {
              // Storage bloqueado
            }
            journeyStore.getState().setSpirit(true);
            window.dispatchEvent(new CustomEvent('kodama-forest'));
          }
        }, 900);
      });
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [spots, found, camera, size, scratch]);

  // A partida: chacoalha, sobe um pouco e encolhe; as luzinhas saem do corpo
  const sparks = useMemo(() => {
    const n = 60;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setAttribute('aLife', new BufferAttribute(new Float32Array(n), 1));
    const material = new ShaderMaterial({
      vertexShader: sparkVertex, fragmentShader: sparkFragment, transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    const list = Array.from({ length: n }, () => ({ p: new Vector3(), v: new Vector3(), life: 0 }));
    return { geometry, material, points, list, next: 0 };
  }, []);
  useEffect(() => () => { sparks.geometry.dispose(); sparks.material.dispose(); }, [sparks]);

  const time = useRef(0);
  useFrame((state, delta) => {
    time.current += delta;
    const now = performance.now() / 1000;
    const dt = Math.min(delta, 1 / 20);
    let busy = false;
    leaving.current.forEach((start, i) => {
      const g = groups.current[i];
      const h = heads.current[i];
      const age = now - start;
      if (!g) return;
      busy = true;
      if (h) h.rotation.z = Math.sign(Math.sin(age * 40)) * 0.45 * Math.max(0, 1 - age / 0.7);
      const k = Math.max(0, (age - 0.35) / 0.55);
      g.scale.setScalar(KODAMA_HUNT.scale * Math.max(0.001, 1 - k));
      g.position.y = spots[i].position[1] + k * 0.8;
      if (age < 0.9 && age > 0.3) {
        for (let s = 0; s < 3; s += 1) {
          const spark = sparks.list[sparks.next];
          sparks.next = (sparks.next + 1) % sparks.list.length;
          spark.p.copy(spots[i].center).add(new Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.4, (Math.random() - 0.5) * 0.4));
          spark.v.set((Math.random() - 0.5) * 0.6, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.6);
          spark.life = 1;
        }
      }
      if (age > 1.6) leaving.current.delete(i);
    });
    // Os que ainda esperam: de vez em quando a cabeça dá um estalo (uma pista para quem olha)
    spots.forEach((s, i) => {
      const h = heads.current[i];
      if (!h || leaving.current.has(i)) return;
      const tick = (time.current * 0.5 + i * 0.37) % 4;
      h.rotation.z = tick < 0.25 ? Math.sign(Math.sin(tick * 60)) * 0.3 : 0;
    });
    const pos = sparks.geometry.attributes.position;
    const life = sparks.geometry.attributes.aLife;
    let alive = false;
    sparks.list.forEach((spark, i) => {
      if (spark.life > 0) {
        spark.life = Math.max(0, spark.life - dt * 0.9);
        spark.p.addScaledVector(spark.v, dt);
        alive = true;
      }
      pos.setXYZ(i, spark.p.x, spark.p.y, spark.p.z);
      life.setX(i, spark.life);
    });
    pos.needsUpdate = true;
    life.needsUpdate = true;
    sparks.points.visible = alive;
    if (busy || alive) state.invalidate();
  });

  return (
    <>
      {spots.map((s, i) => (found.includes(i) ? null : (
        <group key={i} ref={(el) => { groups.current[i] = el; }} position={s.position} rotation={[0, s.rotationY, 0]} scale={KODAMA_HUNT.scale}>
          <mesh geometry={body} material={materials.body} dispose={null} />
          <group ref={(el) => { heads.current[i] = el; }} position={[0, 0.34, 0]}>
            <mesh geometry={head} material={materials.body} dispose={null} />
            <mesh geometry={face} material={materials.face} dispose={null} />
          </group>
        </group>
      )))}
      <primitive object={sparks.points} />
      {spirit ? <SpiritLights /> : null}
    </>
  );
}
