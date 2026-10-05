'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, BoxGeometry, Color, InstancedBufferAttribute, Matrix4, MeshBasicMaterial, Object3D, PlaneGeometry, ShaderMaterial,
} from 'three';
import { blankTexture, labelTexture } from './lanternLabel';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { journeyStore, useJourney } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { mulberry32 } from '../../lib/journey/ridge';
import { currentSpeed, flicker, laneLayout } from '../../lib/journey/lanterns';
import { LANTERNS } from './config';

const lerp = (a, b, t) => a + (b - a) * t;

// Tōrō nagashi: base de madeira, papel quadrado aceso, quatro hastes e aro no topo
const PAPER = { w: 0.34, h: 0.4, y: 0.07 };

function paperGeometry() {
  const g = new BoxGeometry(PAPER.w, PAPER.h, PAPER.w);
  g.translate(0, PAPER.y + PAPER.h / 2, 0);
  return g;
}

function frameGeometry() {
  const parts = [new BoxGeometry(0.48, 0.07, 0.48).translate(0, 0.035, 0)];
  const half = PAPER.w / 2;
  for (const x of [-half, half]) {
    for (const z of [-half, half]) {
      parts.push(new BoxGeometry(0.035, PAPER.h + 0.02, 0.035).translate(x, PAPER.y + PAPER.h / 2, z));
    }
  }
  // Aro do topo: quatro réguas finas
  const top = PAPER.y + PAPER.h;
  parts.push(new BoxGeometry(PAPER.w + 0.04, 0.03, 0.03).translate(0, top, half));
  parts.push(new BoxGeometry(PAPER.w + 0.04, 0.03, 0.03).translate(0, top, -half));
  parts.push(new BoxGeometry(0.03, 0.03, PAPER.w + 0.04).translate(half, top, 0));
  parts.push(new BoxGeometry(0.03, 0.03, PAPER.w + 0.04).translate(-half, top, 0));
  const merged = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  parts.forEach((p) => p.dispose());
  return merged;
}

// Halo: quad virado para a câmera, brilho radial somado (funciona sem bloom)
const haloVertex = /* glsl */ `
  attribute float aGlow;
  uniform float uSize;
  varying vec2 vUv;
  varying float vGlow;
  void main() {
    vUv = uv;
    vGlow = aGlow;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, ${(PAPER.y + PAPER.h / 2).toFixed(2)}, 0.0, 1.0);
    mv.xy += position.xy * uSize;
    gl_Position = projectionMatrix * mv;
  }
`;

const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  varying float vGlow;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float glow = exp(-d * d * 5.0) * (1.0 - smoothstep(0.8, 1.0, d));
    gl_FragColor = vec4(uColor * glow * uIntensity * vGlow, 1.0);
    #include <colorspace_fragment>
  }
`;

// 灯籠流し: lanternas de papel descendo o rio até sumirem na névoa;
// cada mensagem enviada solta mais uma perto da câmera
export default function Lanterns({ reflections, released }) {
  const quality = useJourney((s) => s.quality);
  const baseCount = LANTERNS.count[quality] ?? LANTERNS.count.low;
  const capacity = baseCount + LANTERNS.maxReleased;
  const paperRef = useRef(null);
  const frameRef = useRef(null);
  const haloRef = useRef(null);

  const geometries = useMemo(() => {
    const halo = new PlaneGeometry(1, 1);
    const glow = new InstancedBufferAttribute(new Float32Array(capacity), 1);
    halo.setAttribute('aGlow', glow);
    return { paper: paperGeometry(), frame: frameGeometry(), halo, glow };
  }, [capacity]);

  const materials = useMemo(
    () => ({
      // Sem névoa: o papel é fonte de luz e deve brilhar mesmo ao longe
      paper: new MeshBasicMaterial({ toneMapped: false, fog: false }),
      frame: new MeshBasicMaterial(),
      halo: new ShaderMaterial({
        vertexShader: haloVertex,
        fragmentShader: haloFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uColor: { value: new Color() }, uIntensity: { value: 0 }, uSize: { value: LANTERNS.halo.size } },
      }),
    }),
    [],
  );

  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose?.()),
    [geometries],
  );
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  // Nome no papel das lanternas soltas: um plano por vaga, colado na face virada para a câmera
  const labels = useMemo(
    () => ({
      geometry: new PlaneGeometry(PAPER.w * 0.86, PAPER.h * 0.9),
      offset: new Matrix4().makeTranslation(0, PAPER.y + PAPER.h / 2, PAPER.w / 2 + 0.004),
      materials: Array.from({ length: LANTERNS.maxReleased }, () =>
        new MeshBasicMaterial({ map: blankTexture(), transparent: true, depthWrite: false, toneMapped: false, fog: false })),
    }),
    [],
  );
  const labelRefs = useRef([]);
  useEffect(
    () => () => {
      labels.geometry.dispose();
      labels.materials.forEach((m) => m.dispose());
    },
    [labels],
  );

  // Lanternas fixas em trilha pelo rio + as soltas pelo formulário
  const lanterns = useRef(null);
  const rand = useMemo(() => mulberry32(71), []);
  const spawn = (x, z) => ({ x, z, phase: rand() * Math.PI * 2, speed: LANTERNS.speed * (0.7 + rand() * 0.6) });
  if (lanterns.current === null || lanterns.current.base !== baseCount) {
    lanterns.current = {
      base: baseCount,
      items: laneLayout(baseCount, LANTERNS, rand).map(({ x, z }) => spawn(x, z)),
    };
  }
  const releasesSeen = useRef(journeyStore.getState().lanternReleases);

  const dummy = useMemo(() => new Object3D(), []);
  const colors = useMemo(() => ({ base: new Color(), instance: new Color(), wood: new Color() }), []);
  const glow = useRef(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    const paper = paperRef.current;
    const frame = frameRef.current;
    const halo = haloRef.current;
    // Rio escondido (antes do contato ou em rotas congeladas): não anima nem pede frames
    if (!paper || !frame || !halo || !paper.parent?.parent?.visible) return;
    const journey = journeyStore.getState();
    const { theme } = journey;
    const { items } = lanterns.current;

    // Mensagem enviada: nova lanterna entra perto da margem da câmera
    while (releasesSeen.current < journey.lanternReleases) {
      releasesSeen.current += 1;
      if (items.length < capacity) {
        const label = journey.lanternNames[releasesSeen.current - 1] || '';
        // Nasce na faixa de água visível abaixo do conteúdo, maior que as outras: é a lanterna da pessoa
        const item = { ...spawn(lerp(-1.2, 1.2, rand()), LANTERNS.viewZ - LANTERNS.releaseAhead), released: true, label };
        items.push(item);
        // As carpas (Koi) vêm atrás da lanterna nova; o relógio é o das carpas (só avança em movimento)
        if (released) Object.assign(released, { item, at: released.clock?.() ?? 0 });
      }
    }

    const moving = !journey.reducedMotion;
    if (moving) time.current += delta;
    const t = time.current;
    const [z0, z1] = LANTERNS.laneZ;

    // Correnteza: todas se afastam da câmera; as fixas voltam ao começo, as soltas somem no fim
    for (let i = items.length - 1; i >= 0; i--) {
      const l = items[i];
      if (moving) l.z -= currentSpeed(l.speed, l.z, LANTERNS.viewZ) * delta;
      if (l.z < z0) {
        if (l.released) items.splice(i, 1);
        else l.z = z1;
      }
    }

    // Brilho: forte à noite (dispara o bloom), suave de dia
    const intensity = LANTERNS.glow[theme];
    const k = glow.current === null ? 1 : 1 - Math.exp(-delta * 4);
    glow.current = glow.current === null ? intensity : lerp(glow.current, intensity, k);
    colors.base.set(SCENE_ACCENTS[theme].lantern);
    materials.paper.color.setScalar(glow.current);
    colors.wood.set(LANTERNS.wood[theme]);
    materials.frame.color.lerp(colors.wood, k);
    const h = materials.halo.uniforms;
    h.uColor.value.copy(colors.base);
    h.uIntensity.value = lerp(h.uIntensity.value, LANTERNS.halo[theme], k);

    const positions = reflections?.lanterns.value;
    let slot = 0;
    items.forEach((l, i) => {
      // Entra/sai suave nas pontas da faixa (nasce na margem, some ao longe)
      // As soltas nascem dentro da faixa: só somem ao longe
      const edge = l.released ? Math.min(1, (l.z - z0) / 4) : Math.min(1, (l.z - z0) / 4, (z1 + 2 - l.z) / 2);
      const f = flicker(t, l.phase) * Math.max(0, edge);
      dummy.position.set(l.x + Math.sin(t * 0.5 + l.phase) * 0.15, Math.sin(t * 1.6 + l.phase) * 0.03, l.z);
      // As soltas com nome mantêm a face escrita virada para a câmera (+z), só balançando
      const spin = l.label ? Math.sin(t * 0.4 + l.phase) * 0.25 : l.phase + t * 0.08;
      dummy.rotation.set(Math.sin(t * 1.1 + l.phase) * 0.04, spin, Math.sin(t + l.phase) * 0.05);
      dummy.scale.setScalar(Math.max(0.001, edge) * (l.released ? LANTERNS.releasedScale : 1));
      dummy.updateMatrix();
      paper.setMatrixAt(i, dummy.matrix);
      frame.setMatrixAt(i, dummy.matrix);
      halo.setMatrixAt(i, dummy.matrix);
      paper.setColorAt(i, colors.instance.copy(colors.base).multiplyScalar(f));
      geometries.glow.array[i] = f;
      // No plano do rio, y local = -z do grupo
      if (positions) positions[i].set(dummy.position.x, -l.z, f);

      const label = l.label && slot < LANTERNS.maxReleased ? labelRefs.current[slot] : null;
      if (label) {
        const material = labels.materials[slot];
        const texture = labelTexture(l.label);
        if (material.map !== texture) material.map = texture;
        label.matrix.multiplyMatrices(dummy.matrix, labels.offset);
        label.visible = true;
        slot += 1;
      }
    });
    for (let s = slot; s < LANTERNS.maxReleased; s++) {
      if (labelRefs.current[s]) labelRefs.current[s].visible = false;
    }
    for (const mesh of [paper, frame, halo]) {
      mesh.count = items.length;
      mesh.instanceMatrix.needsUpdate = true;
    }
    if (paper.instanceColor) paper.instanceColor.needsUpdate = true;
    geometries.glow.needsUpdate = true;
    if (reflections) reflections.count.value = items.length;

    if (moving || items.some((l) => l.released)) state.invalidate();
  });

  return (
    <group key={capacity}>
      <instancedMesh ref={paperRef} args={[geometries.paper, materials.paper, capacity]} frustumCulled={false} />
      <instancedMesh ref={frameRef} args={[geometries.frame, materials.frame, capacity]} frustumCulled={false} />
      <instancedMesh ref={haloRef} args={[geometries.halo, materials.halo, capacity]} frustumCulled={false} renderOrder={2} />
      {labels.materials.map((material, i) => (
        <mesh
          key={i}
          ref={(m) => {
            labelRefs.current[i] = m;
          }}
          geometry={labels.geometry}
          material={material}
          matrixAutoUpdate={false}
          visible={false}
          frustumCulled={false}
          renderOrder={1}
        />
      ))}
    </group>
  );
}
