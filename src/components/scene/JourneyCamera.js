'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { FESTIVAL } from '../../lib/festival';
import { journeyStore, effectiveProgress } from '../../store/journey';
import { clamp01 } from '../../lib/journey/season';
import { currentCameraMap, getCameraCurve } from './useCameraMap';
import { cameraT } from '../../lib/journey/cameraMap';
import { cameraShot } from '../../lib/journey/shots';
import { CAMERA_FLIGHT } from './config';
import { power2InOut, responsiveFov } from '../../lib/journey/math';
import { pointer } from '../../lib/pointer';
import { photoRig } from '../../lib/play';

// Parallax do mouse: a câmera inclina alguns graus na direção do cursor (radianos)
const SWAY = { yaw: 0.035, pitch: 0.02, speed: 2.5 };

// Câmera percorre a curva conforme o progresso (amortecido; imediato em reduced motion)
export default function JourneyCamera() {
  const curve = getCameraCurve();
  const current = useRef(null);
  const position = useMemo(() => new Vector3(), []);
  const tangent = useMemo(() => new Vector3(), []);

  // Celular em pé: abre o FOV vertical para o enquadramento não ficar só no torii
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.fov = responsiveFov(aspect);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, aspect, invalidate]);

  // Troca de rota (jornada ↔ rota congelada): voo de 1,2s com power2.inOut até o novo ponto
  const flight = useRef(null);
  const lastRoute = useRef(null);
  // Só com mouse: no toque o "ponteiro" é o dedo rolando a página
  const sway = useMemo(() => ({ x: 0, y: 0, fine: window.matchMedia('(pointer: fine)').matches }), []);
  const fest = useMemo(() => ({ mix: 0, position: new Vector3(), target: new Vector3(...FESTIVAL.camera.lookAt), matrix: new Matrix4(), quaternion: new Quaternion() }), []);

  useFrame((state, delta) => {
    const journey = journeyStore.getState();
    const target = effectiveProgress(journey);
    if (current.current === null) current.current = target;

    if (lastRoute.current !== null && journey.route !== lastRoute.current && !journey.reducedMotion) {
      flight.current = { from: current.current, elapsed: 0 };
    }
    lastRoute.current = journey.route;

    if (flight.current) {
      // Delta limitado: no frameloop "demand" o primeiro frame pode vir depois de uma pausa longa
      flight.current.elapsed += Math.min(delta, 1 / 30);
      const p = Math.min(1, flight.current.elapsed / CAMERA_FLIGHT.duration);
      current.current = flight.current.from + (target - flight.current.from) * power2InOut(p);
      if (p >= 1) flight.current = null;
      state.invalidate();
    } else {
      // Cena leve: depois de esperar a rolagem parar, o primeiro quadro chega com um delta longo; limitado,
      // a câmera desliza até o lugar em vez de pular
      const step = journey.lite ? Math.min(delta, 1 / 30) : delta;
      const k = journey.reducedMotion ? 1 : 1 - Math.exp(-step * 3);
      current.current += (target - current.current) * k;
    }

    // Progresso → posição na curva (acelera até o torii, ver cameraMap.js)
    const map = currentCameraMap(journey);
    const t = cameraT(clamp01(current.current), map);
    curve.getPointAt(t, position);
    curve.getTangentAt(t, tangent);
    state.camera.position.copy(position);
    state.camera.lookAt(position.x + tangent.x, position.y + tangent.y, position.z + tangent.z);

    // Plano do trecho (ver lib/journey/shots): no hero o torii vai para o terço direito
    const shot = cameraShot(clamp01(current.current), { crossAt: map.crossAt, aspect: state.size.width / Math.max(1, state.size.height), ranges: journey.sectionRanges });
    if (shot.yaw) state.camera.rotateY(shot.yaw);
    if (shot.pitch) state.camera.rotateX(shot.pitch);
    if (shot.roll) state.camera.rotateZ(shot.roll);

    // Cursor fora da janela (ou movimento reduzido): volta ao centro devagar
    const follow = sway.fine && pointer.active && !journey.reducedMotion && !journey.lite && !journey.photo;
    const ks = 1 - Math.exp(-delta * SWAY.speed);
    sway.x += ((follow ? pointer.x : 0) - sway.x) * ks;
    sway.y += ((follow ? pointer.y : 0) - sway.y) * ks;
    state.camera.rotateY(-sway.x * SWAY.yaw);
    state.camera.rotateX(sway.y * SWAY.pitch);

    // 写真: no modo foto a câmera livre soma giro e deslocamento a este ponto da trilha
    if (journey.photo) {
      state.camera.rotateY(-photoRig.yaw);
      state.camera.rotateX(-photoRig.pitch);
      state.camera.translateZ(-photoRig.dolly);
      state.camera.translateX(photoRig.truck);
      state.camera.translateY(photoRig.lift);
      state.invalidate();
    }

    // 花火: no festival a câmera voa para a beira do rio, de frente para a ponte e o céu atrás
    // dela, e volta para a trilha quando ele acaba
    const goal = journey.festival ? 1 : 0;
    if (fest.mix !== goal) {
      const step = journey.reducedMotion ? 1 : Math.min(delta, 1 / 30) / FESTIVAL.flight;
      fest.mix = goal ? Math.min(1, fest.mix + step) : Math.max(0, fest.mix - step);
      state.invalidate();
    }
    if (fest.mix > 0) {
      const m = power2InOut(fest.mix);
      // Um balanço leve, como quem assiste de um barco
      const t = state.clock.elapsedTime;
      fest.position.set(FESTIVAL.camera.position[0] + Math.sin(t * 0.21) * 0.5, FESTIVAL.camera.position[1] + Math.sin(t * 0.33) * 0.12, FESTIVAL.camera.position[2]);
      fest.matrix.lookAt(fest.position, fest.target, state.camera.up);
      fest.quaternion.setFromRotationMatrix(fest.matrix);
      state.camera.position.lerp(fest.position, m);
      state.camera.quaternion.slerp(fest.quaternion, m);
    }

    if (Math.abs(target - current.current) > 1e-4) state.invalidate();
  });

  return null;
}
