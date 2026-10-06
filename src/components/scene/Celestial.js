'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, ShaderMaterial, Vector3 } from 'three';
import { journeyStore, effectiveProgress } from '../../store/journey';
import { pointer } from '../../lib/pointer';
import { insideCircle, isSceneClick, projectSphere } from '../../lib/journey/sceneClick';
import { TSUKUYOMI, eyeOpening, tsukuyomi } from '../../lib/journey/tsukuyomi';
import { SCENE_ACCENTS } from '../../lib/palette';
import { CELESTIAL } from './config';
import { smoothstep } from '../../lib/journey/math';
import { NOISE } from './glsl';
import { SUNSET, celestialAt, transitionPhase } from '../../lib/journey/skyTransition';

// Intensidade do disco, do halo e das manchas (mares da lua) por tema
const LOOK = { night: { disc: 1, halo: 0.42, maria: 1 }, day: { disc: 0.6, halo: 0.3, maria: 0 } };

// Tamanho do quad em raios do disco: sobra espaço para o halo se apagar
const EXTENT = 7;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDisc;
  uniform float uHalo;
  uniform float uMaria;
  uniform float uEye;
  uniform float uSpin;
  uniform vec3 uIris;
  uniform vec3 uGlow;
  varying vec2 vUv;
  ${NOISE}

  // 輪廻写輪眼: íris vermelha com quatro anéis concêntricos e nove tomoe (três em cada um dos três
  // anéis de dentro), cada tomoe uma gota com a cauda curva seguindo o anel. Devolve
  // (tinta preta 0..1, anel 0..1)
  vec2 rinne(vec2 p, float d) {
    float a = atan(p.y, p.x);
    float rings = 0.0;
    for (int k = 1; k <= 4; k++) {
      float r = float(k) * 0.205;
      rings = max(rings, 1.0 - smoothstep(0.016, 0.03, abs(d - r)));
    }
    float ink = 1.0 - smoothstep(0.1, 0.115, d);
    for (int k = 1; k <= 3; k++) {
      float r = float(k) * 0.205;
      // Os anéis giram em sentidos alternados, cada um num ritmo
      float dirK = mod(float(k), 2.0) * 2.0 - 1.0;
      for (int j = 0; j < 3; j++) {
        float ang = float(j) * 2.0944 + float(k) * 0.6 + uSpin * dirK * (1.2 - float(k) * 0.2);
        vec2 c = r * vec2(cos(ang), sin(ang));
        float head = 1.0 - smoothstep(0.058, 0.07, length(p - c));
        // Cauda: atrás da cabeça no sentido do giro, afinando e abrindo um pouco para fora
        float da = mod(a - ang + 3.14159 * 3.0, 6.28318) - 3.14159;
        float back = -da * dirK;
        float tl = clamp(back / 0.6, 0.0, 1.0);
        float w = mix(0.05, 0.0, tl);
        float tail = step(0.0, back) * step(back, 0.6) * (1.0 - smoothstep(w - 0.008, w + 0.002, abs(d - r - tl * 0.07)));
        ink = max(ink, max(head, tail));
      }
    }
    return vec2(ink, rings);
  }

  void main() {
    vec2 p = (vUv - 0.5) * ${EXTENT.toFixed(1)};
    float d = length(p);
    float disc = smoothstep(1.0, 0.96, d);
    // Mares lunares: manchas suaves só dentro do disco
    float maria = smoothstep(0.45, 0.75, fbm(p * 1.6 + 3.0)) * uMaria * 0.16;
    // Halo em duas camadas: brilho curto em volta + véu largo
    float halo = (exp(-max(d - 1.0, 0.0) * 2.2) * 0.7 + exp(-d * 0.6) * 0.3) * uHalo;
    // Zera antes da borda do quad: sem retângulo visível no céu
    halo *= 1.0 - smoothstep(${(EXTENT / 2 - 1.2).toFixed(1)}, ${(EXTENT / 2).toFixed(1)}, d);
    float alpha = max(disc * uDisc, halo * (1.0 - disc));
    vec3 col = uColor * (1.0 - maria * disc);
    if (uEye > 0.001) {
      // O olho abre do centro para fora; a íris escurece para a borda e brilha no meio
      vec2 eye = rinne(p, d);
      float reveal = 1.0 - smoothstep(uEye * 1.15 - 0.15, uEye * 1.15, d);
      vec3 iris = mix(uIris * 1.25, uIris * 0.55, smoothstep(0.0, 1.0, d));
      iris = mix(iris, uIris * 0.1, eye.y * 0.9);
      iris = mix(iris, vec3(0.02, 0.0, 0.0), eye.x);
      col = mix(col, iris, reveal * disc);
      // Halo e borda vermelhos
      col = mix(col, uGlow, (1.0 - disc) * uEye);
      alpha = max(alpha, halo * (1.0 - disc) * (1.0 + uEye * 1.5));
    }
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// Sol (昼) / lua (夜): disco com halo pintado, fora da névoa
export default function Celestial() {
  const target = useMemo(() => new Color(), []);
  const low = useMemo(() => new Color(SUNSET.sunLow), []);
  const meshRef = useRef(null);
  const initialized = useRef(false);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        fog: false,
        uniforms: {
          uColor: { value: new Color() },
          uDisc: { value: 0 },
          uHalo: { value: 0 },
          uMaria: { value: 0 },
          uEye: { value: 0 },
          uSpin: { value: 0 },
          uIris: { value: new Color(TSUKUYOMI.iris) },
          uGlow: { value: new Color(TSUKUYOMI.glow) },
        },
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  // 無限月読: clicar na lua à noite liga/desliga o olho (o canvas fica atrás do conteúdo: a cena
  // escuta os cliques da janela e confere se caíram sobre a lua projetada na tela)
  const camera = useThree((s) => s.camera);
  const moon = useMemo(() => ({ world: new Vector3(), scratch: [new Vector3(), new Vector3()], screen: null, hover: 0 }), []);
  useEffect(() => {
    const onClick = (e) => {
      const store = journeyStore.getState();
      if (!moon.screen || !isSceneClick(e.target)) return;
      if (!insideCircle(e.clientX, e.clientY, moon.screen.x, moon.screen.y, moon.screen.r)) return;
      store.setTsukuyomi(!store.tsukuyomi);
    };
    const onKey = (e) => {
      if (e.key === 'Escape' && journeyStore.getState().tsukuyomi) journeyStore.getState().setTsukuyomi(false);
    };
    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [moon]);

  // Liga: o olho abre, um clarão vermelho sai da lua e cobre a tela, e no auge dele a página
  // vira vermelha. Desliga: volta direto. Trocar o tema também desliga
  useEffect(() => {
    const timers = [];
    const root = document.documentElement;
    const unsubscribe = journeyStore.subscribe((state, prev) => {
      if (state.theme !== prev.theme && state.tsukuyomi) state.setTsukuyomi(false);
      if (state.tsukuyomi === prev.tsukuyomi) return;
      timers.splice(0).forEach(clearTimeout);
      if (!state.tsukuyomi) {
        root.removeAttribute('data-tsukuyomi');
        return;
      }
      tsukuyomi.start = performance.now() / 1000;
      if (state.reducedMotion || !moon.screen) {
        root.setAttribute('data-tsukuyomi', '');
        return;
      }
      const { x, y } = moon.screen;
      timers.push(setTimeout(() => {
        const flash = document.createElement('div');
        flash.className = 'tsukuyomi-flash';
        flash.setAttribute('aria-hidden', 'true');
        flash.style.setProperty('--x', `${x}px`);
        flash.style.setProperty('--y', `${y}px`);
        flash.addEventListener('animationend', () => flash.remove());
        document.body.appendChild(flash);
      }, TSUKUYOMI.flashAt * 1000));
      timers.push(setTimeout(() => root.setAttribute('data-tsukuyomi', ''), (TSUKUYOMI.flashAt + 0.45) * 1000));
    });
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
      root.removeAttribute('data-tsukuyomi');
    };
  }, [moon]);

  useFrame((state, delta) => {
    const store = journeyStore.getState();
    // Some do hero em diante (e nas rotas congeladas, onde o progresso efetivo é 0.7)
    const visible = 1 - smoothstep(0.08, 0.18, effectiveProgress(store));
    const u = material.uniforms;
    const mesh = meshRef.current;
    const nowS = performance.now() / 1000;

    // Lua na tela (para o clique): só à noite e enquanto ela aparece
    if (mesh && store.theme === 'night' && visible > 0.5) {
      mesh.getWorldPosition(moon.world);
      moon.screen = projectSphere(moon.world, CELESTIAL.radius * 1.15, camera, state.size.width, state.size.height, moon.scratch);
    } else moon.screen = null;
    // Olho: abre com a curva do TSUKUYOMI, fecha rápido; os tomoe giram (rápido ao abrir)
    const open = store.tsukuyomi ? eyeOpening(nowS, tsukuyomi.start) : 0;
    u.uEye.value = store.tsukuyomi ? open : Math.max(0, u.uEye.value - delta * 2.5);
    if (!store.reducedMotion && u.uEye.value > 0) u.uSpin.value += delta * (0.25 + (1 - open) * 6);
    if (u.uEye.value > 0 && u.uEye.value < 1) state.invalidate();
    // Passar o cursor sobre a lua acende um pouco o halo (a dica do segredo)
    const over = moon.screen && pointer.active
      && insideCircle((pointer.x + 1) / 2 * state.size.width, (1 - pointer.y) / 2 * state.size.height, moon.screen.x, moon.screen.y, moon.screen.r);
    moon.hover += ((over ? 1 : 0) - moon.hover) * (1 - Math.exp(-delta * 6));

    // 日の入り: na troca de tema o astro antigo desce atrás das montanhas e o novo sobe. O sol
    // avermelha perto do horizonte, como o disco das gravuras
    const transit = celestialAt(transitionPhase(performance.now() / 1000));
    if (transit) {
      const look = LOOK[transit.theme];
      u.uColor.value.set(SCENE_ACCENTS[transit.theme].celestial);
      if (transit.theme === 'day') u.uColor.value.lerp(low, Math.min(1, transit.sink * 1.4));
      u.uDisc.value = look.disc * visible;
      u.uHalo.value = look.halo * visible * (1 + transit.sink * 0.8);
      u.uMaria.value = look.maria;
      if (mesh) mesh.position.y = CELESTIAL.position[1] - transit.sink * SUNSET.drop;
      state.invalidate();
      return;
    }
    if (mesh) {
      mesh.position.y = CELESTIAL.position[1];
      // A lua cresce enquanto o olho abre (a lua gigante do Tsukuyomi)
      mesh.scale.setScalar(1 + u.uEye.value * (TSUKUYOMI.moonScale - 1));
    }

    const look = LOOK[store.theme];
    target.set(SCENE_ACCENTS[store.theme].celestial);
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;

    u.uColor.value.lerp(target, k);
    u.uDisc.value += (look.disc * visible - u.uDisc.value) * k;
    u.uHalo.value += (look.halo * visible * (1 + moon.hover * 0.35) - u.uHalo.value) * k;
    u.uMaria.value += (look.maria - u.uMaria.value) * k;

    if (Math.abs(u.uDisc.value - look.disc * visible) > 0.002) state.invalidate();
  });

  return (
    <mesh ref={meshRef} position={CELESTIAL.position} material={material}>
      <planeGeometry args={[CELESTIAL.radius * EXTENT, CELESTIAL.radius * EXTENT]} />
    </mesh>
  );
}
