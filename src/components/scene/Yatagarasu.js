'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending, ConeGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster,
  ShaderMaterial, Vector2, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { journeyStore } from '../../store/journey';
import { CROW, CROW_CAW, setCrowHitTester } from '../../lib/crow';
import { sceneHeight, toNdc } from '../../lib/pointer';

// 八咫烏 (Yatagarasu): o corvo de três pernas, mensageiro do sol que guia os perdidos. Quando a
// pessoa fica um tempo parada na hero, ele chega voando, pousa no alto do torii e fica ali (olha em
// volta, bica a viga); clicado, grasna e dá uma dica (ver CrowHint). Se a pessoa rola para longe,
// ele vai embora. Atrás dele, um halo dourado sutil (o sol)
// O corvo é o modelo "Crow" de Alexei Ostapenko (Sketchfab, CC BY 4.0, crédito no rodapé),
// otimizado para a web (public/models/crow.glb), com a terceira perna acrescentada aqui
// Coordenadas: as do torii (o grupo fica no topo do kasagi); frente do corvo em +z, pés em y = 0

const MODEL = '/models/crow.glb';
// Trechos da animação do modelo (segundos): pousado olhando e bicando, voo e pouso
const CLIP = { idle: [0, 6.8], fly: [8.4, 9.9], land: [9.9, 10.5] };
// Topo do kasagi no centro (viga arqueada: base + espessura + curva + chanfro)
const PERCH_TOP = 10.1;
// Comprimento do corvo em unidades da cena: proporcional ao torii (10 de altura)
const LENGTH = 1.3;
// Chegada: de cima e da direita até o pouso; saída: para cima e para a esquerda
const ARRIVE = { from: new Vector3(9, 7, 6), via: new Vector3(4, 4.5, -3), duration: 2.4 };
const LEAVE = { to: new Vector3(-10, 9, 4), via: new Vector3(-3, 3.5, -2), duration: 1.9 };
const bezier = (a, b, c, t, out) => out.set(0, 0, 0).addScaledVector(a, (1 - t) ** 2).addScaledVector(b, 2 * (1 - t) * t).addScaledVector(c, t * t);

const haloVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const haloFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    float d = length(c);
    // Disco do sol bem suave e um anel fino em volta
    float disc = smoothstep(1.0, 0.0, d) * 0.35;
    float ring = exp(-pow((d - 0.78) * 14.0, 2.0)) * 0.6;
    gl_FragColor = vec4(vec3(1.0, 0.72, 0.28) * (disc + ring), (disc + ring) * uOpacity);
  }
`;

// A cena não tem luzes (tudo é pintado nos materiais): o corvo usa a textura do modelo num material
// sem luz, com um contraluz violeta-azul na borda (o brilho das penas de corvo) somado no shader
function crowMaterial(map) {
  const material = new MeshBasicMaterial({ map, color: '#b9bfd8' });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRimN;\nvarying vec3 vRimV;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRimN = normalize(normalMatrix * objectNormal);\nvRimV = normalize(-mvPosition.xyz);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRimN;\nvarying vec3 vRimV;')
      .replace('#include <opaque_fragment>', 'float rim = smoothstep(0.55, 0.85, 1.0 - max(dot(normalize(vRimN), normalize(vRimV)), 0.0));\noutgoingLight += vec3(0.45, 0.45, 0.95) * rim * 0.7;\n#include <opaque_fragment>');
  };
  return material;
}

// 三本足: a terceira perna, no mesmo cinza das outras: canela fina, três dedos para a frente e um
// para trás (presa ao quadril do esqueleto, acompanha o corpo)
function thirdLeg(length, color) {
  const toe = (dir, len) => {
    const g = new ConeGeometry(length * 0.035, len, 6);
    g.translate(0, len / 2, 0);
    g.rotateX(Math.PI / 2);
    g.rotateY(dir);
    g.translate(0, length * 0.02, 0);
    return g;
  };
  const shin = new CylinderGeometry(length * 0.03, length * 0.045, length, 8);
  shin.translate(0, length / 2, 0);
  const g = mergeGeometries([shin, ...[-0.5, 0, 0.5].map((a) => toe(a, length * 0.32)), toe(Math.PI, length * 0.24)].map((p) => {
    const flat = p.toNonIndexed();
    flat.deleteAttribute('uv');
    return flat;
  }));
  return new Mesh(g, new MeshBasicMaterial({ color }));
}

export default function Yatagarasu({ position, rotationY }) {
  const camera = useThree((s) => s.camera);
  const birdRef = useRef(null);
  const haloRef = useRef(null);
  const [rig, setRig] = useState(null);
  const state = useRef({ mode: 'hidden', t: 0, lastActive: performance.now(), caw: -10, clock: 0 });

  const halo = useMemo(() => ({
    geometry: new PlaneGeometry(2.4, 2.4),
    material: new ShaderMaterial({ vertexShader: haloVertex, fragmentShader: haloFragment, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uOpacity: { value: 0 } } }),
  }), []);
  useEffect(() => () => { halo.geometry.dispose(); halo.material.dispose(); }, [halo]);

  // O modelo carrega em segundo plano, quando o navegador sossega (é pequeno: ~230 KB)
  useEffect(() => {
    let cancelled = false;
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(async () => {
      const [{ GLTFLoader }, { MeshoptDecoder }, { AnimationMixer }] = await Promise.all([
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/libs/meshopt_decoder.module.js'),
        import('three'),
      ]);
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODEL);
      if (cancelled) return;
      const model = gltf.scene;
      model.traverse((o) => {
        if (o.isMesh) {
          o.frustumCulled = false;
          o.material = crowMaterial(o.material.map);
        }
      });
      const mixer = new AnimationMixer(model);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
      action.paused = true;
      mixer.setTime(0);
      const pivot = new Group();
      pivot.add(model);
      pivot.updateMatrixWorld(true);
      // O carregador troca espaços por _ nos nomes dos nós
      const bone = (name) => model.getObjectByName(name.replace(/\s/g, '_'));
      const at = (o) => o.getWorldPosition(new Vector3());
      // Frente do corvo: da pelve para a cabeça, no plano do chão. O modelo gira para olhar para +z
      const pelvis = bone('CROW_ Pelvis_02');
      const head = bone('CROW_ Head_05');
      const forward = at(head).sub(at(pelvis)).setY(0).normalize();
      model.rotation.y = -Math.atan2(forward.x, forward.z);
      // Tamanho pela caixa da malha na pose atual (o arquivo traz rotação e escala internas, e a
      // distância entre ossos não bate com a malha): o comprimento vira LENGTH e os pés vão a y = 0
      let skinned = null;
      model.traverse((o) => { if (!skinned && o.isSkinnedMesh) skinned = o; });
      const poseBox = () => {
        pivot.updateMatrixWorld(true);
        skinned.computeBoundingBox();
        return skinned.boundingBox.clone().applyMatrix4(skinned.matrixWorld);
      };
      model.scale.multiplyScalar(LENGTH / Math.max(1e-6, poseBox().getSize(new Vector3()).z));
      const box = poseBox();
      model.position.y -= box.min.y;
      model.position.x -= (box.min.x + box.max.x) / 2;
      model.position.z -= (box.min.z + box.max.z) / 2;
      pivot.updateMatrixWorld(true);
      // A terceira perna: entre as duas, um pouco atrás, do quadril até o chão
      const hip = at(bone('CROW_ L Thigh_040')).add(at(bone('CROW_ R Thigh_050'))).multiplyScalar(0.5);
      const leg = thirdLeg(Math.max(0.05, hip.y * 0.92), '#6c7280');
      leg.position.set(hip.x, 0, hip.z - LENGTH * 0.05);
      pivot.add(leg);
      pelvis.attach(leg);
      setRig({ pivot, mixer, action, head });
    }, { timeout: 5000 });
    return () => { cancelled = true; cancel(id); };
  }, []);

  // Atividade: rolar, teclar, clicar ou tocar (mexer o mouse para ler não conta)
  useEffect(() => {
    const wake = () => { state.current.lastActive = performance.now(); };
    const events = ['wheel', 'keydown', 'pointerdown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    const onCaw = () => { state.current.caw = performance.now() / 1000; };
    window.addEventListener(CROW_CAW, onCaw);
    return () => {
      events.forEach((e) => window.removeEventListener(e, wake));
      window.removeEventListener(CROW_CAW, onCaw);
    };
  }, []);

  // Clique: a página pergunta se acertou o corvo pousado (com folga: ele é pequeno na tela)
  useEffect(() => {
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    return setCrowHitTester((clientX, clientY) => {
      const s = state.current;
      if (!birdRef.current || (s.mode !== 'perched' && s.mode !== 'landing')) return false;
      const { x, y } = toNdc(clientX, clientY, window.innerWidth, sceneHeight());
      raycaster.setFromCamera(ndc.set(x, y), camera);
      const center = birdRef.current.getWorldPosition(new Vector3()).add(new Vector3(0, LENGTH * 0.4, 0));
      return raycaster.ray.distanceSqToPoint(center) < 1.5 ** 2;
    });
  }, [camera]);

  const tmp = useMemo(() => ({ p: new Vector3(), q: new Vector3(), perch: new Vector3(0, PERCH_TOP, 0) }), []);

  useFrame((_, delta) => {
    const s = state.current;
    const bird = birdRef.current;
    if (!bird || !rig) return;
    const now = performance.now();
    const time = now / 1000;
    const dt = Math.min(delta, 1 / 20);
    const journey = journeyStore.getState();
    const atHero = journey.route === 'journey' && journey.progress < CROW.heroProgress;

    if (s.mode === 'hidden') {
      bird.visible = false;
      haloRef.current.visible = false;
      if (atHero && now - s.lastActive > CROW.idleMs) {
        s.mode = journey.reducedMotion ? 'perched' : 'arriving';
        s.t = 0;
      }
      return;
    }
    bird.visible = true;
    haloRef.current.visible = true;
    s.t += dt;
    if ((s.mode === 'perched' || s.mode === 'landing') && !atHero) {
      s.mode = journey.reducedMotion ? 'hidden' : 'leaving';
      s.t = 0;
    }

    // Pose do modelo: o trecho da animação de cada momento, tocado pelo relógio daqui
    s.clock += dt;
    const [a, b] = s.mode === 'arriving' || s.mode === 'leaving' ? CLIP.fly : s.mode === 'landing' ? CLIP.land : CLIP.idle;
    rig.action.time = s.mode === 'landing' ? Math.min(b, a + s.t) : a + (s.clock % (b - a));
    rig.mixer.update(0);

    if (s.mode === 'arriving' || s.mode === 'leaving') {
      const leaving = s.mode === 'leaving';
      const path = leaving ? LEAVE : ARRIVE;
      const k = Math.min(1, s.t / path.duration);
      const e = leaving ? k ** 1.8 : 1 - (1 - k) ** 2.2;
      const from = leaving ? tmp.perch : ARRIVE.from;
      const to = leaving ? LEAVE.to : tmp.perch;
      bezier(from, path.via, to, e, tmp.p);
      bezier(from, path.via, to, Math.min(1, e + 0.02), tmp.q);
      bird.position.copy(tmp.p);
      bird.rotation.set(0, Math.atan2(tmp.q.x - tmp.p.x, tmp.q.z - tmp.p.z), 0);
      if (k >= 1) {
        s.t = 0;
        if (leaving) {
          s.mode = 'hidden';
          s.lastActive = now;
        } else s.mode = 'landing';
      }
    } else {
      // Pousado: virado de três quartos para quem chega pelo caminho (a câmera vem de -z)
      bird.position.copy(tmp.perch);
      bird.rotation.set(0, Math.PI + 1.05, 0);
      if (s.mode === 'landing' && s.t >= CLIP.land[1] - CLIP.land[0]) {
        s.mode = 'perched';
        s.clock = 0;
      }
    }

    // Grasnado: a cabeça sobe e volta (o modelo não tem osso de bico)
    const cawT = time - s.caw;
    const caw = cawT >= 0 && cawT < 0.7 ? Math.sin(Math.PI * (cawT / 0.7)) : 0;
    if (caw > 0) rig.head.rotateX(-caw * 0.55);

    // O halo do sol: acende no pouso e fica fraco atrás dele
    const haloTarget = s.mode === 'perched' || s.mode === 'landing' ? 0.38 + caw * 0.5 : 0;
    halo.material.uniforms.uOpacity.value += (haloTarget - halo.material.uniforms.uOpacity.value) * Math.min(1, dt * 3);
    haloRef.current.position.copy(bird.position).add(tmp.q.set(0, LENGTH * 0.45, -0.05));
    haloRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh ref={haloRef} geometry={halo.geometry} material={halo.material} visible={false} renderOrder={1} />
      <group ref={birdRef} visible={false}>
        {rig ? <primitive object={rig.pivot} /> : null}
      </group>
    </group>
  );
}
