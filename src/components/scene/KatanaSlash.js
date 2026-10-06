'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BufferAttribute, BufferGeometry, DoubleSide, Points, RingGeometry, ShaderMaterial, Vector3,
} from 'three';
import { journeyStore } from '../../store/journey';
import { groundHeight } from '../../lib/journey/ground';
import { addRipple } from '../../lib/journey/ripples';
import { insideCircle, isSceneClick, projectSphere } from '../../lib/journey/sceneClick';
import { getCameraCurve } from './useCameraMap';
import { NOISE } from './glsl';
import { GROUND, KATANA, KATANA_SLASH, RIVER } from './config';

// 水の呼吸: clicar na katana solta um golpe de água desenhado como as ondas das gravuras (arco azul
// com linhas e espuma branca na borda). As gotas voam, caem com a gravidade e, as que chegam ao
// rio, abrem anéis na água (ver ripples); as que caem na margem somem no chão

const ARC = KATANA_SLASH.arc;

const arcVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const arcFragment = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vPos;
  ${NOISE}

  void main() {
    // a: posição ao longo do arco (0..1), r: de dentro para fora (0..1)
    float a = atan(vPos.y, vPos.x) / ${ARC.angle.toFixed(3)};
    float r = (length(vPos) - ${(ARC.radius - ARC.width / 2).toFixed(3)}) / ${ARC.width.toFixed(3)};
    // O golpe corre pelo arco; atrás da ponta a água se desfaz
    float head = uProgress * 1.35;
    float trail = clamp(1.0 - (head - a) / 0.75, 0.0, 1.0) * step(a, head);
    // Mais grosso no meio, fino nas pontas, com a borda de fora recortada em cristas (fbm)
    float thick = pow(sin(3.14159 * clamp(a, 0.0, 1.0)), 0.6);
    float crest = fbm(vec2(a * 14.0, uTime * 2.0)) * 0.35;
    float body = step(abs(r - 0.5), 0.5 * thick) * step(r, 0.95 - crest * (1.0 - a));
    if (body * trail < 0.01) discard;
    // Água das gravuras: azul fundo por dentro, azul claro, linhas brancas e espuma na borda
    vec3 deep = vec3(0.04, 0.2, 0.52);
    vec3 light = vec3(0.3, 0.64, 0.96);
    vec3 col = mix(deep, light, smoothstep(0.1, 0.75, r));
    float lines = smoothstep(0.82, 0.95, sin(r * 34.0 + fbm(vec2(a * 6.0, r * 3.0)) * 6.0));
    col = mix(col, vec3(0.92, 0.97, 1.0), lines * 0.55);
    float foam = smoothstep(0.62, 0.86, r + crest * 0.4);
    col = mix(col, vec3(1.0), foam);
    float alpha = trail * (0.82 + 0.18 * foam) * smoothstep(0.0, 0.06, a);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

const dropVertex = /* glsl */ `
  attribute float aSize;
  attribute float aAlive;
  varying float vAlive;
  void main() {
    vAlive = aAlive;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * aAlive * (260.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const dropFragment = /* glsl */ `
  varying float vAlive;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5 || vAlive < 0.01) discard;
    // Gota: borda azulada, miolo claro com um brilho deslocado
    vec3 col = mix(vec3(0.85, 0.95, 1.0), vec3(0.35, 0.65, 0.95), smoothstep(0.1, 0.5, d));
    col += smoothstep(0.16, 0.0, length(c - vec2(-0.12, -0.12))) * 0.5;
    gl_FragColor = vec4(col, (1.0 - smoothstep(0.35, 0.5, d)) * 0.95);
    #include <colorspace_fragment>
  }
`;

export default function KatanaSlash() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  // Centro da katana (para o clique) e o nível da água do rio
  const center = useMemo(() => {
    const y = groundHeight(KATANA.x, KATANA.z, GROUND);
    return new Vector3(KATANA.x, y + KATANA_SLASH.height, KATANA.z);
  }, []);
  const river = useMemo(() => {
    const end = getCameraCurve().getPointAt(1);
    return { x: end.x, y: end.y - RIVER.drop, z: end.z + RIVER.offsetZ };
  }, []);

  const arc = useMemo(() => {
    const geometry = new RingGeometry(ARC.radius - ARC.width / 2, ARC.radius + ARC.width / 2, 64, 1, 0, ARC.angle);
    const material = new ShaderMaterial({
      vertexShader: arcVertex,
      fragmentShader: arcFragment,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { uProgress: { value: 0 }, uTime: { value: 0 } },
    });
    return { geometry, material };
  }, []);

  const drops = useMemo(() => {
    const n = KATANA_SLASH.drops;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setAttribute('aSize', new BufferAttribute(new Float32Array(n), 1));
    geometry.setAttribute('aAlive', new BufferAttribute(new Float32Array(n), 1));
    const material = new ShaderMaterial({
      vertexShader: dropVertex, fragmentShader: dropFragment, transparent: true, depthWrite: false,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    const list = Array.from({ length: n }, () => ({
      p: new Vector3(), v: new Vector3(), at: 0, alive: false, size: 1,
    }));
    return { geometry, material, points, list };
  }, []);

  useEffect(() => () => {
    arc.geometry.dispose();
    arc.material.dispose();
    drops.geometry.dispose();
    drops.material.dispose();
  }, [arc, drops]);

  const arcRef = useRef(null);
  const slash = useRef({ start: -Infinity, pending: false });
  const scratch = useMemo(() => [new Vector3(), new Vector3()], []);

  // Clique na katana (o canvas fica atrás do conteúdo: confere a katana projetada na tela)
  useEffect(() => {
    const onClick = (e) => {
      if (journeyStore.getState().reducedMotion || !isSceneClick(e.target)) return;
      const hit = projectSphere(center, KATANA_SLASH.clickRadius, camera, size.width, size.height, scratch);
      if (!hit || !insideCircle(e.clientX, e.clientY, hit.x, hit.y, hit.r)) return;
      slash.current = { start: performance.now() / 1000, pending: true };
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [camera, center, size, scratch]);

  const tmp = useMemo(() => ({ local: new Vector3(), dir: new Vector3(), toCam: new Vector3() }), []);

  useFrame((state, delta) => {
    const mesh = arcRef.current;
    if (!mesh) return;
    const now = performance.now() / 1000;
    const age = now - slash.current.start;
    const progress = age / ARC.duration;

    // O arco: na frente da katana, virado para a câmera, girando enquanto corta
    const active = progress < 1.4;
    mesh.visible = active;
    if (active) {
      tmp.toCam.subVectors(camera.position, center).normalize();
      mesh.position.copy(center).addScaledVector(tmp.toCam, 1.4);
      mesh.quaternion.copy(camera.quaternion);
      mesh.rotateZ(ARC.tilt - Math.min(progress, 1) * 0.7);
      mesh.updateMatrixWorld();
      arc.material.uniforms.uProgress.value = progress;
      arc.material.uniforms.uTime.value = now;
    }

    // Golpe novo: as gotas nascem ao longo do arco, saindo conforme a ponta passa por elas
    if (slash.current.pending && active) {
      slash.current.pending = false;
      drops.list.forEach((d) => {
        const t = Math.random();
        const angle = t * ARC.angle;
        const radius = ARC.radius + (Math.random() - 0.3) * ARC.width;
        tmp.local.set(Math.cos(angle) * radius, Math.sin(angle) * radius, (Math.random() - 0.5) * 0.3);
        d.p.copy(tmp.local).applyMatrix4(mesh.matrixWorld);
        // Voa na direção do corte (tangente) e para fora, com um impulso para cima e para o rio
        tmp.dir.set(-Math.sin(angle), Math.cos(angle), 0).transformDirection(mesh.matrixWorld);
        const speed = 3 + Math.random() * 5;
        d.v.copy(tmp.dir).multiplyScalar(speed);
        d.v.x += -1.6 - Math.random() * 1.8;
        d.v.y += 1.5 + Math.random() * 2.5;
        d.v.z += (Math.random() - 0.5) * 2;
        d.at = slash.current.start + (t / 1.35) * ARC.duration;
        d.size = 0.022 + Math.random() * 0.05;
        d.alive = true;
      });
    }

    // As gotas: gravidade e arrasto; na água abrem um anel, no chão somem
    const pos = drops.geometry.attributes.position;
    const sizes = drops.geometry.attributes.aSize;
    const alive = drops.geometry.attributes.aAlive;
    const dt = Math.min(delta, 1 / 20);
    let any = false;
    drops.list.forEach((d, i) => {
      let show = 0;
      if (d.alive && now >= d.at) {
        d.v.y -= KATANA_SLASH.gravity * dt;
        d.v.multiplyScalar(1 - dt * 0.4);
        d.p.addScaledVector(d.v, dt);
        const lx = d.p.x - river.x;
        const overWater = Math.abs(lx) < KATANA_SLASH.waterEdge && d.p.z < river.z + 76 && d.p.z > river.z - 76;
        if (overWater && d.p.y <= river.y) {
          addRipple(d.p.x, d.p.z, 0.7 + d.size * 6, now);
          d.alive = false;
        } else if (!overWater && d.p.y <= groundHeight(d.p.x, d.p.z, GROUND)) {
          d.alive = false;
        } else if (d.p.y < river.y - 3) {
          d.alive = false;
        } else show = 1;
      } else if (d.alive) any = true;
      if (show) any = true;
      pos.setXYZ(i, d.p.x, d.p.y, d.p.z);
      sizes.setX(i, d.size * 10);
      alive.setX(i, show);
    });
    pos.needsUpdate = true;
    sizes.needsUpdate = true;
    alive.needsUpdate = true;
    drops.points.visible = any;
    if (active || any) state.invalidate();
  });

  return (
    <>
      <mesh ref={arcRef} geometry={arc.geometry} material={arc.material} visible={false} renderOrder={4} frustumCulled={false} />
      <primitive object={drops.points} />
    </>
  );
}
