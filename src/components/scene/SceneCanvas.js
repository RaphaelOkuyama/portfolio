'use client';
import { Component, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { journeyStore, useJourney } from '../../store/journey';
import { usePathname } from 'next/navigation';
import { gpuRenderer, webglMode } from '../../lib/webgl';
import { autoQuality, readSavedQuality } from '../../lib/journey/quality';
import StaticBackdrop from './StaticBackdrop';
import PosterBackdrop from './PosterBackdrop';
import InkBreath from './InkBreath';

// three/R3F só carregam no cliente, fora do bundle inicial
const loadCanvas = () => import('./Canvas3D');
const Canvas3D = dynamic(loadCanvas, { ssr: false, loading: () => null });
// Sem GPU: a montanha pintada e animada em Canvas 2D (leve, só baixa nesse caso)
const PaintedScene = dynamic(() => import('./PaintedScene'), { ssr: false, loading: () => null });

// Altura da tela com as barras do navegador recolhidas (lvh): fixa. Com inset: 0 a cena mudava de
// tamanho toda vez que a barra do celular sumia ou voltava na rolagem (o renderizador, o bloom e as
// camadas pintadas eram refeitos no meio do gesto)
const wrapperStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100lvh', zIndex: -1, pointerEvents: 'none' };

// A cena 3D (three.js ~240 KB, geometrias e shaders) é o trabalho mais pesado da página: feita no
// carregamento, segurava a thread por segundos num celular. Agora a página abre com o cenário
// pintado (StaticBackdrop: as mesmas montanhas, céu e rio) e a cena 3D só começa quando a pessoa
// interage (mexe o mouse, rola, toca, tecla) ou, se ninguém interagir, um pouco depois do
// carregamento terminar. Ela entra num fade por cima do fundo estático
const START_EVENTS = ['pointermove', 'pointerdown', 'wheel', 'scroll', 'touchstart', 'keydown'];
// Sem interação, a cena começa este tempo depois do carregamento (a pessoa só lendo a hero)
export const SCENE_AUTOSTART_MS = 8000;

const coarse = () => window.matchMedia('(pointer: coarse)').matches;

// Placa de vídeo boa e mouse: a cena começa logo depois do carregamento, sem esperar interação.
// O teste de WebGL só roda aqui, com a página já pintada (antes ele segurava a primeira pintura)
function capableNow() {
  if (!window.matchMedia('(pointer: fine)').matches) return false;
  if (webglMode() !== 'gpu') return false;
  const level = readSavedQuality(window.localStorage) ?? autoQuality(gpuRenderer());
  return level !== 'low';
}

function useSceneStart(enabled) {
  const [start, setStart] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let timer = 0;
    let idleId = 0;
    const go = () => {
      cleanup();
      performance.mark('scene-start');
      setStart(true);
    };
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1));
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
    const afterLoad = () => {
      idleId = idle(() => {
        if (capableNow()) go();
        else timer = setTimeout(() => { idleId = idle(go, { timeout: 2000 }); }, SCENE_AUTOSTART_MS);
      }, { timeout: 1500 });
    };
    const cleanup = () => {
      START_EVENTS.forEach((type) => window.removeEventListener(type, go));
      window.removeEventListener('load', afterLoad);
      clearTimeout(timer);
      cancelIdle(idleId);
    };
    START_EVENTS.forEach((type) => window.addEventListener(type, go, { passive: true, once: true }));
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
    return cleanup;
  }, [enabled]);
  return start;
}

// Se o chunk falhar ou o renderer lançar erro, avisa o pai para trocar pelo fundo estático
class SceneErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SceneCanvas() {
  const [webgl, setWebgl] = useState(null);
  const [failed, setFailed] = useState(false);
  const quality = useJourney((s) => s.quality);
  const lite = useJourney((s) => s.lite);
  const theme = useJourney((s) => s.theme);
  const mix = useJourney((s) => Math.round(s.seasonMix));
  const sceneReady = useJourney((s) => s.sceneReady);
  // A cena só entra por cima do pôster quando a abertura termina (ele para de aproximar)
  const introDone = useJourney((s) => s.introDone);
  // Home no topo: o pôster (o primeiro quadro da própria cena). Nas outras rotas, ou com a página
  // aberta já rolada, o desenho em SVG (a câmera começa em outro ponto da montanha)
  const pathname = usePathname();
  const [scrolledAtLoad, setScrolledAtLoad] = useState(false);
  useEffect(() => {
    if (window.scrollY > window.innerHeight * 0.6) setScrolledAtLoad(true);
  }, []);
  const poster = pathname === '/' && !scrolledAtLoad;
  // Depois do fade da cena, o fundo estático sai do DOM (não fica pintando por baixo)
  const [backdropGone, setBackdropGone] = useState(false);
  // Sem GPU: a cena pintada assume quando a primeira camada fica pronta, e o SVG sai
  const [paintedReady, setPaintedReady] = useState(false);

  // O teste de WebGL cria um contexto de GPU: feito no carregamento, segurava a primeira pintura
  // (o quadro esperava o processo da GPU acordar). Agora só acontece quando a cena vai começar;
  // até lá o cenário pintado já está na tela
  const start = useSceneStart(!failed);
  useEffect(() => {
    if (start && webgl === null) {
      // Sem GPU (WebGL na CPU): a mesma cena, no modo leve (ver Canvas3D). Sem WebGL nenhum: pintada
      const mode = webglMode();
      const store = journeyStore.getState();
      store.setLite(mode === 'software');
      journeyStore.setState({ sceneStarted: true });
      // Sem escolha salva: o nível que a placa de vídeo aguenta
      if (mode !== 'none') store.setAutoQuality(autoQuality(gpuRenderer(), { mobile: coarse() }));
      setWebgl(mode !== 'none');
    }
  }, [start, webgl]);

  // Sem WebGL (ou se a cena falhar), o fundo estático é a cena
  useEffect(() => {
    if (webgl === false || failed) journeyStore.getState().setSceneReady();
  }, [webgl, failed]);

  useEffect(() => {
    if (!sceneReady || !introDone || webgl !== true || failed) return undefined;
    const id = setTimeout(() => setBackdropGone(true), 1500);
    return () => clearTimeout(id);
  }, [sceneReady, introDone, webgl, failed]);

  // Sem WebGL acelerado: a cena pintada e animada. Se o chunk 3D falhou, só o fundo estático
  if (webgl === false || failed) {
    return (
      <div aria-hidden="true" data-scene="fallback" style={wrapperStyle}>
        {paintedReady && !failed ? null : <StaticBackdrop theme={theme} mix={mix} />}
        {failed ? null : <PaintedScene onReady={() => setPaintedReady(true)} />}
        <div className="washi" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" data-scene="webgl" data-lite={lite ? '' : undefined} style={wrapperStyle}>
      {/* Até a cena 3D chegar: o pôster (o mesmo quadro da cena) ou o cenário pintado; some depois do fade */}
      {backdropGone ? null : poster ? <PosterBackdrop /> : <StaticBackdrop theme={theme} mix={mix} />}
      {webgl && quality && start ? (
        <SceneErrorBoundary onError={() => setFailed(true)}>
          {/* A cena entra num fade por cima do fundo estático, sem estalo */}
          <div style={{ position: 'absolute', inset: 0, opacity: sceneReady && introDone ? 1 : 0, transition: 'opacity 1.2s ease' }}>
            <Canvas3D />
          </div>
        </SceneErrorBoundary>
      ) : null}
      {/* Papel washi estático + vinheta por cima da cena (abaixo do conteúdo) */}
      <div className="washi" />
      <InkBreath />
    </div>
  );
}
