'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BufferAttribute, MeshBasicMaterial, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { journeyStore, useJourney } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { useCameraMap, getCameraCurve } from './useCameraMap';
import { useAccentMaterials } from './useAccentMaterials';
import { besideTorii } from './toriiFrame';
import {
  katanaGeometry, KOMAINU_SEAT, komainuGeometry, komainuPedestalGeometry, pagodaGeometry, shishiOdoshiGeometry, SHISHI_PIVOT_Y, stoneLanternGeometry, taikobashiGeometry,
} from './shrineGeometry';
import { gangiGeometry, sandoGeometry } from './pathGeometry';
import {
  GROUND, KATANA, KOMAINU, PAGODA, RIVER, RIVERSIDE, SHISHI_ODOSHI, STONE_LANTERNS, TAIKOBASHI,
} from './config';

// 狛犬: o par de guardiões nos pés do torii, virados para quem chega. A figura é o escaneamento
// "Shinto Guard Dog (Komainu)" de mechaghost (Sketchfab, CC BY 4.0, crédito no rodapé), otimizado
// para a web (public/models/komainu.glb); a da direita é o espelho da esquerda. Enquanto o modelo
// não chega (e no modo leve, sem GPU), ficam as figuras procedurais
const KOMAINU_MODEL = '/models/komainu.glb';
// Profundidade da figura (do focinho à cauda) sobre o pedestal, e o clareamento da textura (a
// pedra escaneada é escura; a cor da paleta tinge por cima, como nas outras pedras)
const KOMAINU_DEPTH = 1.55;
const KOMAINU_BOOST = 2.3;

// Lê o modelo uma vez: a malha vira uma geometria com a pose embutida, de frente para +z, centrada
// em x/z, com a base em y = 0
let komainuFigure = null;
function loadKomainuFigure() {
  komainuFigure ??= (async () => {
    const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
    ]);
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(KOMAINU_MODEL);
    gltf.scene.updateMatrixWorld(true);
    let mesh = null;
    gltf.scene.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
    // O arquivo guarda posições e normais quantizadas (inteiros normalizados): passam para float
    // antes de embutir a transformação, senão os valores saem de [-1, 1] e são cortados
    const geometry = mesh.geometry.clone();
    ['position', 'normal'].forEach((name) => {
      const src = geometry.getAttribute(name);
      if (!src) return;
      const out = new Float32Array(src.count * 3);
      for (let i = 0; i < src.count; i += 1) {
        out[i * 3] = src.getX(i);
        out[i * 3 + 1] = src.getY(i);
        out[i * 3 + 2] = src.getZ(i);
      }
      geometry.setAttribute(name, new BufferAttribute(out, 3));
    });
    geometry.applyMatrix4(mesh.matrixWorld);
    // O escaneamento olha para -x
    geometry.rotateY(Math.PI / 2);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = box.getSize(new Vector3());
    geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    geometry.scale(KOMAINU_DEPTH / size.z, KOMAINU_DEPTH / size.z, KOMAINU_DEPTH / size.z);
    return { geometry, map: mesh.material.map };
  })();
  return komainuFigure;
}

export function Komainu() {
  const { params } = useCameraMap();
  const lite = useJourney((s) => s.lite);
  const materials = useAccentMaterials({ stone: { accent: 'granite' } });
  const [figure, setFigure] = useState(null);
  const figureMaterial = useMemo(() => (figure ? new MeshBasicMaterial({ map: figure.map }) : null), [figure]);
  const pair = useMemo(() => [-1, 1].map((side) => {
    const { x, y, z, facing } = besideTorii(params.toriiT, side * KOMAINU.right, KOMAINU.ahead);
    // Virados um pouco para dentro do caminho, encarando quem chega
    return { side, position: [x, y, z], rotationY: facing + side * KOMAINU.turnIn };
  }), [params.toriiT]);

  // O modelo carrega quando o navegador sossega (~220 KB)
  useEffect(() => {
    if (lite) return undefined;
    let cancelled = false;
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1200));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => {
      loadKomainuFigure().then((f) => { if (!cancelled) setFigure(f); }).catch(() => {});
    }, { timeout: 4000 });
    return () => { cancelled = true; cancel(id); };
  }, [lite]);
  useEffect(() => () => figureMaterial?.dispose(), [figureMaterial]);

  // A pedra da figura acompanha o tom das outras pedras (dia/noite)
  useFrame(() => {
    if (figureMaterial) figureMaterial.color.copy(materials.stone.color).multiplyScalar(KOMAINU_BOOST);
  });

  return pair.map(({ side, position, rotationY }) => (figure && !lite ? (
    <group key={side} position={position} rotation={[0, rotationY, 0]} scale={KOMAINU.scale}>
      <mesh geometry={komainuPedestalGeometry()} material={materials.stone} dispose={null} />
      <mesh geometry={figure.geometry} material={figureMaterial} position={[0, KOMAINU_SEAT, 0]} scale={[side, 1, 1]} dispose={null} />
    </group>
  ) : (
    <mesh
      key={side}
      geometry={komainuGeometry(side < 0 ? 'a' : 'un')}
      material={materials.stone}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={KOMAINU.scale}
      dispose={null}
    />
  )));
}

// Lanternas da trilha (pares ladeando o caminho) e das cabeceiras da ponte, viradas para o caminho
function lanternSpots() {
  const points = getCameraCurve().getSpacedPoints(400);
  const trail = STONE_LANTERNS.z.flatMap((z) => {
    // x do caminho naquela profundidade: as lanternas acompanham a trilha
    const pathX = points.reduce((best, p) => (Math.abs(p.z - z) < Math.abs(best.z - z) ? p : best)).x;
    return [-1, 1].map((side) => ({ x: pathX + side * STONE_LANTERNS.x, z, rotationY: (side * Math.PI) / 2 }));
  });
  const bridge = RIVERSIDE.lanterns.map(([x, z]) => ({ x, z, rotationY: Math.sign(x) * (Math.PI / 2) }));
  return [...trail, ...bridge].map(({ x, z, rotationY }) => ({
    key: `${x}:${z}`, position: [x, groundHeight(x, z, GROUND), z], rotationY,
  }));
}

// 石灯籠: lanternas de pedra ladeando a trilha e marcando a ponte; a janela acende à noite
export function StoneLanterns() {
  const materials = useAccentMaterials({
    stone: { accent: 'granite' },
    light: { accent: 'tourou', glow: STONE_LANTERNS.glow },
  });
  const { stone, light } = stoneLanternGeometry();
  const spots = useMemo(lanternSpots, []);

  return spots.map(({ key, position, rotationY }) => (
    <group key={key} position={position} rotation={[0, rotationY, 0]} scale={STONE_LANTERNS.scale}>
      <mesh geometry={stone} material={materials.stone} dispose={null} />
      <mesh geometry={light} material={materials.light} dispose={null} />
    </group>
  ));
}

// 参道 e 雁木: o caminho de pedra do começo da montanha até o pagode, e a escadaria que desce da
// margem até a água, ao lado da ponte
export function StonePaths() {
  const materials = useAccentMaterials({ stone: { accent: 'granite' } });
  return (
    <>
      <mesh geometry={sandoGeometry()} material={materials.stone} dispose={null} />
      <mesh geometry={gangiGeometry()} material={materials.stone} dispose={null} />
    </>
  );
}

// 鹿威し no canto do jardim zen: a água enche o bambu devagar, ele tomba de uma vez, bate na
// pedra e volta. Parado com movimento reduzido
const REST = 0.28;
const TIPPED = -0.42;
export function ShishiOdoshi() {
  const materials = useAccentMaterials({ bamboo: { accent: 'bamboo' }, stone: { accent: 'granite' } });
  const { fixed, stone, pipe } = shishiOdoshiGeometry();
  const pipeRef = useRef(null);
  const clock = useRef(0);
  const { x, z } = SHISHI_ODOSHI;
  const position = [x, groundHeight(x, z, GROUND), z];

  useFrame((_, delta) => {
    const { reducedMotion } = journeyStore.getState();
    if (!pipeRef.current || reducedMotion) return;
    clock.current = (clock.current + delta) % SHISHI_ODOSHI.cycle;
    const t = clock.current / SHISHI_ODOSHI.cycle;
    // 0–80%: enche (a boca desce aos poucos); 80–84%: tomba; 84–100%: volta e balança até parar
    let angle;
    if (t < 0.8) angle = REST - (t / 0.8) * 0.18;
    else if (t < 0.84) angle = REST - 0.18 + (TIPPED - REST + 0.18) * ((t - 0.8) / 0.04) ** 2;
    else {
      const back = (t - 0.84) / 0.16;
      angle = REST + (TIPPED - REST) * Math.exp(-back * 5) * Math.cos(back * 9);
    }
    pipeRef.current.rotation.z = angle;
  });

  return (
    <group position={position} rotation={[0, SHISHI_ODOSHI.rotY, 0]} scale={SHISHI_ODOSHI.scale}>
      <mesh geometry={fixed} material={materials.bamboo} dispose={null} />
      <mesh geometry={stone} material={materials.stone} dispose={null} />
      <group position={[0.05, SHISHI_PIVOT_Y, 0]}>
        <mesh ref={pipeRef} geometry={pipe} material={materials.bamboo} rotation={[0, 0, REST]} dispose={null} />
      </group>
    </group>
  );
}

// 五重塔: vermelho e branco, telhados escuros, bronze no sōrin e nos sinos
export function Pagoda() {
  const materials = useAccentMaterials({
    red: { accent: 'torii' }, plaster: { accent: 'plaster' }, roof: { accent: 'roof', double: true }, bronze: { accent: 'bronze' },
  });
  const geometry = pagodaGeometry();
  const position = [PAGODA.x, groundHeight(PAGODA.x, PAGODA.z, GROUND), PAGODA.z];
  return (
    <group position={position} rotation={[0, PAGODA.rotY, 0]} scale={PAGODA.scale}>
      {['red', 'plaster', 'roof', 'bronze'].map((part) => (
        <mesh key={part} geometry={geometry[part]} material={materials[part]} dispose={null} />
      ))}
    </group>
  );
}

// 太鼓橋 sobre o rio, à frente do contato: de margem a margem, na altura da água
export function Taikobashi() {
  const materials = useAccentMaterials({
    red: { accent: 'torii' }, dark: { accent: 'toriiTop' }, bronze: { accent: 'bronze' },
  });
  const { red, dark, bronze } = taikobashiGeometry(TAIKOBASHI);
  const position = useMemo(() => {
    const end = getCameraCurve().getPointAt(1);
    return [end.x, end.y - RIVER.drop - 0.1, TAIKOBASHI.z];
  }, []);
  return (
    <group position={position}>
      <mesh geometry={red} material={materials.red} dispose={null} />
      <mesh geometry={dark} material={materials.dark} dispose={null} />
      <mesh geometry={bronze} material={materials.bronze} dispose={null} />
    </group>
  );
}

// 刀掛け: katana e wakizashi no suporte de laca, bainhas vermelhas, tsuba de bronze
export function Katana() {
  const materials = useAccentMaterials({
    stone: { accent: 'granite' }, lacquer: { accent: 'toriiTop' }, saya: { accent: 'torii' },
    wrap: { accent: 'plaster' }, metal: { accent: 'bronze' },
  });
  const geometry = katanaGeometry();
  const { x, z } = KATANA;
  return (
    <group position={[x, groundHeight(x, z, GROUND), z]} rotation={[0, KATANA.rotY, 0]} scale={KATANA.scale}>
      {['stone', 'lacquer', 'saya', 'wrap', 'metal'].map((part) => (
        <mesh key={part} geometry={geometry[part]} material={materials[part]} dispose={null} />
      ))}
    </group>
  );
}
