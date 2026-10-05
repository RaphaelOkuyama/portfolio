'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, DoubleSide, InstancedBufferAttribute, MeshBasicMaterial, Object3D, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { journeyStore } from '../../store/journey';
import { mulberry32 } from '../../lib/journey/ridge';
import { clampToZone, insideZone, orbitPoint, separation, swimStep } from '../../lib/journey/koi';
import { pointer } from '../../lib/pointer';
import { koiGeometry } from './koiGeometry';
import { KOI } from './config';

const VARIANTS = ['kohaku', 'showa', 'plain'];
const lerp = (a, b, t) => a + (b - a) * t;

// Material das carpas: o corpo ondula da cabeça para a cauda (onda que cresce até a ponta), mais
// forte quando ela acelera; a cor mistura um pouco com a da água, como se nadasse logo abaixo
function koiMaterial(water) {
  const material = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  const uniforms = { uTime: { value: 0 }, uBright: { value: 1 }, uSubmerge: { value: KOI.submerge }, uWater: water };
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `attribute vec3 aSwim;\nuniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float along = clamp(0.5 - position.z, 0.0, 1.0);
      float wave = sin(uTime * 7.0 * aSwim.y + aSwim.x - position.z * 6.0);
      transformed.x += wave * (0.015 + 0.1 * along * along) * aSwim.z;`,
    );
    shader.fragmentShader = `uniform float uBright;\nuniform float uSubmerge;\nuniform vec3 uWater;\n${shader.fragmentShader}`.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      diffuseColor.rgb = mix(diffuseColor.rgb * uBright, uWater, uSubmerge);`,
    );
  };
  return material;
}

// Carpas no rio do contato: passeiam, vêm até o cursor sobre a água e seguem a lanterna solta
export default function Koi({ water, released }) {
  const meshRefs = useRef([]);
  const material = useMemo(() => koiMaterial(water), [water]);
  useEffect(() => () => material.dispose(), [material]);

  // Montadas depois da cena (ver River): o shader compila em paralelo, sem travar a página
  // (cada malha direto: o grupo do rio fica invisível até o fim da jornada e seria pulado; a cena
  // vai junto por causa da névoa, que muda o programa)
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    meshRefs.current.forEach((mesh) => {
      if (mesh) gl.compileAsync(mesh, camera, scene).catch(() => {});
    });
  }, [gl, camera, scene]);

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
      effort: 0.5,
      wander: null,
      wanderUntil: 0,
      rand,
    }));
  }, []);

  // Uma InstancedMesh por variedade (as manchas estão na geometria), cada uma com as suas carpas
  const groups = useMemo(() => VARIANTS.map((variant) => {
    const members = school.filter((k) => k.variant === variant);
    const geometry = koiGeometry(variant).clone();
    geometry.setAttribute('aSwim', new InstancedBufferAttribute(new Float32Array(members.length * 3), 3));
    return { variant, members, geometry };
  }).filter((g) => g.members.length), [school]);
  useEffect(() => () => groups.forEach((g) => g.geometry.dispose()), [groups]);

  // Cor de cada instância (ogon, platina; as pintadas ficam brancas e mostram as manchas)
  useEffect(() => {
    const color = new Color();
    groups.forEach((g, gi) => {
      const mesh = meshRefs.current[gi];
      if (!mesh) return;
      g.members.forEach((k, i) => mesh.setColorAt(i, color.set(k.tint)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [groups]);

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
    const first = meshRefs.current[0];
    // Rio escondido (antes do fim da jornada ou fora da home): nada a fazer
    if (!first || !first.parent?.visible) return;
    const journey = journeyStore.getState();
    const moving = !journey.reducedMotion;
    const dt = Math.min(delta, 1 / 20);
    if (moving) clock.current += dt;
    const t = clock.current;
    const u = material.userData.uniforms;
    u.uTime.value = t;
    u.uBright.value = lerp(u.uBright.value, KOI.brightness[journey.theme], 1 - Math.exp(-delta * 4));

    // Cursor sobre a água: o raio da câmera até o plano do rio, nas coordenadas do rio
    let lure = null;
    if (pointer.active) {
      first.parent.getWorldPosition(ray.origin);
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

    groups.forEach((g, gi) => {
      const mesh = meshRefs.current[gi];
      if (!mesh) return;
      const swim = g.geometry.attributes.aSwim;
      g.members.forEach((k, i) => {
        dummy.position.set(k.x, KOI.y + Math.sin(t * 0.8 + k.phase) * 0.008, k.z);
        dummy.rotation.set(0, k.heading, 0);
        dummy.scale.setScalar(k.size);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        swim.setXYZ(i, k.phase, 0.7 + 0.6 * k.effort, 0.5 + 0.8 * k.effort);
      });
      mesh.instanceMatrix.needsUpdate = true;
      swim.needsUpdate = true;
    });
  });

  // frustumCulled: a esfera de colisão é a da geometria na origem, não a das carpas espalhadas
  return groups.map((g, gi) => (
    <instancedMesh
      key={g.variant}
      ref={(m) => { meshRefs.current[gi] = m; }}
      args={[g.geometry, material, g.members.length]}
      frustumCulled={false}
    />
  ));
}
