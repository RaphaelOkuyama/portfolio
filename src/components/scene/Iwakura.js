'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, FrontSide, MeshBasicMaterial, Vector3, Vector4,
} from 'three';
import { journeyStore } from '../../store/journey';
import { useCameraMap } from './useCameraMap';
import { iwakuraGeometry } from './iwakuraGeometry';
import { useAccentMaterials } from './useAccentMaterials';
import { besideTorii } from './toriiFrame';
import { IWAKURA, IWAKURA_CUT } from './config';

const PARTS = {
  rock: { accent: 'iwakura' },
  rope: { accent: 'shimenawa' },
  paper: { accent: 'shide', double: true },
};

// 水の呼吸: o 黒閃 da katana (o 3º golpe, lá embaixo no rio) corta o iwakura ao meio, como o
// Tanjiro partindo a pedra gigante no fim do treino (episódio 3): um corte só, do topo ao chão,
// bem no meio. O golpe fica guardado e o corte só aparece quando a pessoa volta à hero: um fio
// vermelho desce pela pedra e as duas metades se afastam, inclinando para fora e abrindo a fenda
// (a corda e os papéis partem junto). Vale até recarregar a página
let cutPending = false;
if (typeof window !== 'undefined') {
  window.addEventListener('black-flash', () => { cutPending = true; });
}

// Plano do corte no espaço da pedra: quase vertical, pelo meio
const PLANE_NORMAL = new Vector3(...IWAKURA_CUT.normal).normalize();
const PLANE = new Vector4(PLANE_NORMAL.x, PLANE_NORMAL.y, PLANE_NORMAL.z, PLANE_NORMAL.dot(new Vector3(...IWAKURA_CUT.point)));

// Material que só desenha um lado do plano (no espaço do objeto, então acompanha a metade que
// se afasta). `side` 1 = de um lado do plano, -1 = do outro. `glow` acende a borda do corte em
// vermelho, só acima de `sweep` (a altura por onde a lâmina já passou), com a ponta mais quente
function cutMaterial(side, faces) {
  const uniforms = { uPlane: { value: PLANE }, uSide: { value: side }, uGlow: { value: 0 }, uSweep: { value: 10 } };
  const material = new MeshBasicMaterial({ vertexColors: true, side: faces });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCutPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;\nuniform vec4 uPlane;\nuniform float uSide;\nuniform float uGlow;\nuniform float uSweep;')
      .replace('#include <clipping_planes_fragment>', [
        '#include <clipping_planes_fragment>',
        'float cutDist = dot(uPlane.xyz, vCutPos) - uPlane.w;',
        'if (cutDist * uSide < 0.0) discard;',
      ].join('\n'))
      .replace('#include <opaque_fragment>', [
        // O fio só na pedra (as pedrinhas do chão também cruzam o plano)
        'float cutLine = smoothstep(0.06, 0.0, abs(cutDist)) * step(0.3, vCutPos.y);',
        'float cutPass = smoothstep(uSweep - 0.04, uSweep + 0.04, vCutPos.y);',
        'float cutHead = exp(-pow((vCutPos.y - uSweep) / 0.08, 2.0));',
        'outgoingLight = mix(outgoingLight, vec3(1.0, 0.12, 0.08) * (1.6 + cutHead * 1.4), min(1.0, uGlow * cutLine * (cutPass + cutHead)));',
        '#include <opaque_fragment>',
      ].join('\n'));
  };
  return { material, uniforms };
}

// A face do corte: onde a superfície da pedra cruza o plano, um contorno fechado preenchido em
// leque a partir do centro (a pedra é quase convexa). As pedrinhas do chão ficam de fora
function capGeometry(rock) {
  const pos = rock.getAttribute('position');
  const index = rock.getIndex();
  const n = PLANE_NORMAL;
  const u = new Vector3(0, 1, 0).projectOnPlane(n).normalize();
  const v = new Vector3().crossVectors(n, u);
  const a = new Vector3();
  const b = new Vector3();
  const points = [];
  const triangles = (index ? index.count : pos.count) / 3;
  const at = (i) => (index ? index.getX(i) : i);
  for (let t = 0; t < triangles; t += 1) {
    for (let e = 0; e < 3; e += 1) {
      a.fromBufferAttribute(pos, at(t * 3 + e));
      b.fromBufferAttribute(pos, at(t * 3 + ((e + 1) % 3)));
      const da = n.dot(a) - PLANE.w;
      const db = n.dot(b) - PLANE.w;
      if ((da < 0) === (db < 0)) continue;
      const p = a.clone().lerp(b, da / (da - db));
      if (p.y > IWAKURA_CUT.capFloor) points.push(p);
    }
  }
  const center = points.reduce((c, p) => c.add(p), new Vector3()).divideScalar(Math.max(1, points.length));
  const angle = (p) => Math.atan2(p.clone().sub(center).dot(v), p.clone().sub(center).dot(u));
  points.sort((p, q) => angle(p) - angle(q));
  const out = [];
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    out.push(center.x, center.y, center.z, p.x, p.y, p.z, q.x, q.y, q.z);
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(out, 3));
  return g;
}

// Duas metades, cada uma com a pedra recortada e a face do corte (o miolo, um tom mais claro)
function useCutMaterials() {
  const set = useMemo(() => Object.fromEntries([1, -1].map((side) => [side, {
    rock: cutMaterial(side, FrontSide),
    rope: cutMaterial(side, DoubleSide),
    paper: cutMaterial(side, DoubleSide),
  }])), []);
  const cap = useMemo(() => ({ material: new MeshBasicMaterial({ side: DoubleSide }) }), []);
  useEffect(() => () => {
    Object.values(set).forEach((half) => Object.values(half).forEach((m) => m.material.dispose()));
    cap.material.dispose();
  }, [set, cap]);
  return { ...set, cap };
}

const CORE = new Color(IWAKURA_CUT.core);

// 磐座 (iwakura): a rocha sagrada amarrada com a corda 注連縄 e os papéis 紙垂, pousada no chão
// ao lado do torii do hero. Mesmo crossfade 昼/夜 dos materiais do torii
export default function Iwakura() {
  const { params } = useCameraMap();
  const materials = useAccentMaterials(PARTS);
  const cut = useCutMaterials();
  const geometry = iwakuraGeometry();
  const cap = useMemo(() => capGeometry(geometry.rock), [geometry]);
  useEffect(() => () => cap.dispose(), [cap]);
  // Celular em pé: não há espaço ao lado do torii sem a pedra ficar cortada atrás do texto
  const roomy = useThree((s) => s.size.width / s.size.height >= IWAKURA.minAspect);
  const wholeRef = useRef(null);
  const halvesRef = useRef(null);
  const halfRefs = useRef({});
  const anim = useRef({ cut: false, t: -1, still: 0, last: -1 });
  // Do topo da pedra até o chão: o caminho da lâmina
  const top = useMemo(() => {
    geometry.rock.computeBoundingBox();
    return geometry.rock.boundingBox.max.y;
  }, [geometry]);

  // Afunda um pouco no chão: pedra assentada, não pousada
  const { position, rotationY } = useMemo(() => {
    const { x, y, z, facing } = besideTorii(params.toriiT, IWAKURA.offset[0], IWAKURA.offset[1]);
    return { position: [x, y - IWAKURA.sink, z], rotationY: facing + IWAKURA.turn };
  }, [params.toriiT]);

  useFrame((state, delta) => {
    const a = anim.current;
    const dt = Math.min(delta, 1 / 20);
    // O corte espera a pessoa voltar à hero e a câmera parar (a pedra à vista, sem pressa)
    if (!a.cut) {
      const { route, progress } = journeyStore.getState();
      const moved = Math.abs(progress - a.last) > 0.0004;
      a.last = progress;
      a.still = moved ? 0 : a.still + dt;
      if (!cutPending || route !== 'journey' || progress > IWAKURA_CUT.heroProgress) return;
      if (a.still < IWAKURA_CUT.settle) {
        state.invalidate();
        return;
      }
      a.cut = true;
      a.t = 0;
      wholeRef.current.visible = false;
      halvesRef.current.visible = true;
    }
    // As cores seguem as da paleta (dia/noite), também depois do corte; o miolo é a pedra clara
    cut.cap.material.color.copy(materials.rock.color).lerp(CORE, IWAKURA_CUT.coreMix);
    [1, -1].forEach((side) => {
      const half = cut[side];
      half.rock.material.color.copy(materials.rock.color);
      half.rope.material.color.copy(materials.rope.color);
      half.paper.material.color.copy(materials.paper.color);
    });
    const { pause, sweep, hold, part, fade } = IWAKURA_CUT;
    if (a.t > pause + sweep + hold + part) return;
    a.t += dt;
    // A lâmina desce do topo ao chão (rápida no começo, assentando no fim); o fio fica aceso um
    // instante e apaga aos poucos enquanto as metades se afastam
    const s = Math.min(1, Math.max(0, (a.t - pause) / sweep));
    const sweepY = top * (1 - s) ** 2.2 - 0.1;
    const glow = a.t < pause ? 0 : 1 - Math.min(1, Math.max(0, (a.t - pause - sweep - hold) / fade));
    [1, -1].forEach((side) => {
      Object.values(cut[side]).forEach((m) => {
        m.uniforms.uGlow.value = glow;
        m.uniforms.uSweep.value = sweepY;
      });
    });
    // As metades: paradas até a lâmina passar, depois se afastam devagar (pedra pesada: começa e
    // termina suave), cada uma para o seu lado do plano, tombando um pouco para fora pela base
    const k = Math.min(1, Math.max(0, (a.t - pause - sweep - hold) / part));
    const e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
    [1, -1].forEach((side) => {
      const half = halfRefs.current[side];
      half.position.copy(PLANE_NORMAL).multiplyScalar(side * IWAKURA_CUT.distance * e).setY(0);
      half.rotation.set(side * PLANE_NORMAL.z * IWAKURA_CUT.tilt * e, 0, -side * PLANE_NORMAL.x * IWAKURA_CUT.tilt * e);
    });
    state.invalidate();
  });

  const parts = (half) => (
    <>
      <mesh geometry={geometry.rock} material={half.rock.material} dispose={null} />
      <mesh geometry={cap} material={cut.cap.material} />
      <mesh geometry={geometry.rope} material={half.rope.material} dispose={null} />
      <mesh geometry={geometry.straw} material={half.rope.material} dispose={null} />
      <mesh geometry={geometry.paper} material={half.paper.material} dispose={null} />
    </>
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={IWAKURA.scale} visible={roomy}>
      <group ref={wholeRef}>
        <mesh geometry={geometry.rock} material={materials.rock} dispose={null} />
        <mesh geometry={geometry.rope} material={materials.rope} dispose={null} />
        <mesh geometry={geometry.straw} material={materials.rope} dispose={null} />
        <mesh geometry={geometry.paper} material={materials.paper} dispose={null} />
      </group>
      <group ref={halvesRef} visible={false}>
        <group ref={(el) => { halfRefs.current[1] = el; }}>{parts(cut[1])}</group>
        <group ref={(el) => { halfRefs.current[-1] = el; }}>{parts(cut[-1])}</group>
      </group>
    </group>
  );
}
