'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, Color, DoubleSide, FrontSide, MeshBasicMaterial, Vector3, Vector4 } from 'three';
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
// Tanjiro cortando a pedra no fim do treino. O golpe fica guardado e o corte só aparece quando a
// pessoa volta à hero: um fio vermelho atravessa a pedra e a metade de cima escorrega pelo plano
// do corte (a corda e os papéis vão juntos). Vale até recarregar a página
let cutPending = false;
if (typeof window !== 'undefined') {
  window.addEventListener('black-flash', () => { cutPending = true; });
}

// Plano do corte no espaço da pedra: diagonal, como o golpe de uma espada
const PLANE_NORMAL = new Vector3(...IWAKURA_CUT.normal).normalize();
const PLANE = new Vector4(PLANE_NORMAL.x, PLANE_NORMAL.y, PLANE_NORMAL.z, PLANE_NORMAL.dot(new Vector3(...IWAKURA_CUT.point)));
// A metade de cima desliza pelo plano, para o lado que desce
const SLIDE = new Vector3(0, -1, 0).projectOnPlane(PLANE_NORMAL).normalize();

// Material que só desenha um lado do plano (no espaço do objeto, então acompanha a metade que
// desliza). `side` 1 = acima do plano, -1 = abaixo. `glow` acende a borda do corte em vermelho
function cutMaterial(side, faces) {
  const uniforms = { uPlane: { value: PLANE }, uSide: { value: side }, uGlow: { value: 0 } };
  const material = new MeshBasicMaterial({ vertexColors: true, side: faces });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCutPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCutPos;\nuniform vec4 uPlane;\nuniform float uSide;\nuniform float uGlow;')
      .replace('#include <clipping_planes_fragment>', [
        '#include <clipping_planes_fragment>',
        'float cutDist = dot(uPlane.xyz, vCutPos) - uPlane.w;',
        'if (cutDist * uSide < 0.0) discard;',
      ].join('\n'))
      .replace('#include <opaque_fragment>', [
        // O fio só na pedra (as pedrinhas do chão também cruzam o plano)
        'outgoingLight = mix(outgoingLight, vec3(1.0, 0.12, 0.08) * 1.6, uGlow * smoothstep(0.06, 0.0, abs(cutDist)) * step(0.3, vCutPos.y));',
        '#include <opaque_fragment>',
      ].join('\n'));
  };
  return { material, uniforms };
}

// Duas metades, cada uma com as faces da frente (a pedra) e as de trás (o miolo da pedra cortada,
// numa cor mais clara: olhando pelo corte, as faces de trás fazem a vez da tampa)
function useCutMaterials() {
  const set = useMemo(() => Object.fromEntries([1, -1].map((side) => [side, {
    rock: cutMaterial(side, FrontSide),
    core: cutMaterial(side, BackSide),
    rope: cutMaterial(side, DoubleSide),
    paper: cutMaterial(side, DoubleSide),
  }])), []);
  useEffect(() => () => Object.values(set).forEach((half) => Object.values(half).forEach((m) => m.material.dispose())), [set]);
  return set;
}

const CORE = new Color(IWAKURA_CUT.core);

// 磐座 (iwakura): a rocha sagrada amarrada com a corda 注連縄 e os papéis 紙垂, pousada no chão
// ao lado do torii do hero. Mesmo crossfade 昼/夜 dos materiais do torii
export default function Iwakura() {
  const { params } = useCameraMap();
  const materials = useAccentMaterials(PARTS);
  const cut = useCutMaterials();
  const geometry = iwakuraGeometry();
  // Celular em pé: não há espaço ao lado do torii sem a pedra ficar cortada atrás do texto
  const roomy = useThree((s) => s.size.width / s.size.height >= IWAKURA.minAspect);
  const wholeRef = useRef(null);
  const halvesRef = useRef(null);
  const topRef = useRef(null);
  const anim = useRef({ cut: false, t: -1 });

  // Afunda um pouco no chão: pedra assentada, não pousada
  const { position, rotationY } = useMemo(() => {
    const { x, y, z, facing } = besideTorii(params.toriiT, IWAKURA.offset[0], IWAKURA.offset[1]);
    return { position: [x, y - IWAKURA.sink, z], rotationY: facing + IWAKURA.turn };
  }, [params.toriiT]);

  useFrame((state, delta) => {
    const a = anim.current;
    // O corte espera a pessoa voltar à hero (a pedra à vista)
    if (!a.cut) {
      const { route, progress } = journeyStore.getState();
      if (!cutPending || route !== 'journey' || progress > IWAKURA_CUT.heroProgress) return;
      a.cut = true;
      a.t = 0;
      wholeRef.current.visible = false;
      halvesRef.current.visible = true;
    }
    if (a.t > IWAKURA_CUT.glow + IWAKURA_CUT.slide + 0.5) return;
    a.t += Math.min(delta, 1 / 20);
    // As cores seguem as da paleta (dia/noite); o miolo é a pedra clara de dentro
    [1, -1].forEach((side) => {
      const half = cut[side];
      half.rock.material.color.copy(materials.rock.color);
      half.core.material.color.copy(materials.rock.color).lerp(CORE, 0.55);
      half.rope.material.color.copy(materials.rope.color);
      half.paper.material.color.copy(materials.paper.color);
      // O fio vermelho acende de uma vez e apaga devagar enquanto a metade escorrega
      const glow = Math.max(0, 1 - Math.max(0, a.t - IWAKURA_CUT.glow * 0.5) / IWAKURA_CUT.glow);
      Object.values(half).forEach((m) => { m.uniforms.uGlow.value = glow; });
    });
    // Metade de cima: parada enquanto o fio brilha, depois escorrega, acelerando, e assenta
    const k = Math.min(1, Math.max(0, (a.t - IWAKURA_CUT.glow) / IWAKURA_CUT.slide));
    const e = k * k * (3 - 2 * k);
    topRef.current.position.copy(SLIDE).multiplyScalar(IWAKURA_CUT.distance * e);
    topRef.current.rotation.z = -IWAKURA_CUT.tilt * e;
    state.invalidate();
  });

  const parts = (half) => (
    <>
      <mesh geometry={geometry.rock} material={half.rock.material} dispose={null} />
      <mesh geometry={geometry.rock} material={half.core.material} dispose={null} />
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
        <group ref={topRef}>{parts(cut[1])}</group>
        {parts(cut[-1])}
      </group>
    </group>
  );
}
