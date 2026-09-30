# Fase 2 — Loader + Hero: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a abertura imersiva do site:
- tema aplicado antes da hidratação, sem flash;
- loader ensō (円相) desenhado com DrawSVG enquanto a cena fica pronta;
- hero com o nome em ScrambleText, ciclando latim → katakana → kanji;
- pétalas de sakura com vento que fogem do cursor;
- torii que a câmera atravessa;
- sol/lua com transição 昼/夜;
- cursor de tinta com rastro de pincel.

**Architecture:** Continua a base da fase 1:
- A store `journeyStore` ganha `sceneReady` e `loaderDone`.
- O loader fica no layout (aparece uma vez por carga de página), por cima do conteúdo já renderizado. O texto do hero continua no HTML do servidor, o que é bom para o LCP.
- As novas peças 3D (Petals, Torii, Celestial) leem a store dentro de `useFrame`.
- A lógica pura (progresso do loader, sequência do nome, dados das pétalas, rastro do cursor, script de tema) fica em `src/lib/` com testes unitários.
- O comportamento integrado é testado com Playwright.

**Tech Stack:** Next.js 16 (App Router, JS), React 19.2, three 0.186, @react-three/fiber 9, @react-three/drei 10, zustand 5, lenis 1.3, GSAP 3.15 (ScrambleTextPlugin e DrawSVGPlugin, que vêm no pacote `gsap`), Vitest 3, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-immersive-japanese-redesign-design.md` (§4.0, §4.1, §4.10, §6, §8 fase 2)

## Global Constraints

- Tudo em JavaScript (sem TypeScript), seguindo o padrão do repo: `'use client'` no topo de componentes cliente e imports relativos.
- GSAP só via `src/lib/gsap.js`; não importar de `'gsap'` direto em componentes.
- Componentes 3D leem a store com `journeyStore.getState()` dentro de `useFrame`; nunca usar o seletor React (`useJourney`) para valores que mudam por frame.
- Canvas com `aria-hidden="true"`; todo conteúdo continua no DOM.
- Cores novas só em `src/lib/palette.js` (fonte única). Cores que ficam atrás de texto passam pelo teste de contraste AA já existente. Elementos decorativos da cena ficam em `SCENE_ACCENTS`.
- `high`: ~1500 partículas; `low`: ~300 (`QUALITY_SETTINGS[quality].particles`).
- Rotas fora de `/` usam `route: 'frozen'` (outono): as pétalas (primavera) não aparecem lá.
- `prefers-reduced-motion`:
  - loader sem espera mínima e sem fade;
  - o ScrambleText mostra o nome final direto, sem ciclo;
  - pétalas paradas;
  - cursor sem rastro.
- Fonte japonesa: pilha de fontes do sistema (`'Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', 'Noto Serif JP', serif`). Sem download de fonte CJK nesta fase.
- `@react-three/postprocessing` continua fora (bloom chega com as lanternas, na fase 5).
- Mensagens de commit no padrão do repo (`Feat:`, `Fix:`, `Test:`, `Style:`, `Chore:` + descrição em português), terminando com uma linha em branco e depois exatamente `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/themeBoot.js` | Script inline que aplica `data-theme` antes da hidratação |
| `src/lib/loader.js` | Progresso do traço do ensō (puro) |
| `src/lib/hero/name.js` | Sequência do nome e caracteres do scramble |
| `src/lib/pointer.js` | Ponteiro em NDC compartilhado com a cena |
| `src/lib/journey/petals.js` | Dados das pétalas e opacidade por estação |
| `src/lib/cursor/trail.js` | Poda e espessura do rastro do cursor |
| `src/components/EnsoLoader.js` | Overlay do loader |
| `src/components/InkCursor.js` | Cursor de tinta (substitui `CustomCursor`) |
| `src/components/scene/Petals.js` | Sakura instanciada com shader |
| `src/components/scene/Torii.js` | Torii procedural |
| `src/components/scene/Celestial.js` | Sol (昼) / lua (夜) |
| `tests/unit/theme-boot.test.js`, `loader.test.js`, `hero-name.test.js`, `pointer.test.js`, `petals.test.js`, `trail.test.js` | Testes unitários |
| `tests/e2e/loader.spec.js`, `hero.spec.js`, `cursor.spec.js` | Testes E2E |

Arquivos modificados:
- `src/lib/gsap.js`, `src/lib/palette.js`, `src/store/journey.js`
- `src/app/layout.js`, `src/app/page.js`, `src/app/globals.css`
- `src/components/Navbar.js`
- `src/components/scene/SceneCanvas.js`, `Canvas3D.js`, `World.js`, `config.js`
- `tests/unit/journey-store.test.js`, `tests/unit/palette.test.js`, `tests/e2e/theme.spec.js`

Arquivos removidos: `src/components/LoadingScreen.js` e `src/components/CustomCursor.js`.

---

### Task 1: Tema antes da hidratação e transição 昼/夜 mais lenta

**Files:**
- Create: `src/lib/themeBoot.js`, `tests/unit/theme-boot.test.js`
- Modify:
  - `src/app/layout.js` (tag `<html>` e `<head>`)
  - `src/app/globals.css` (regra `body`, linha `transition: background-color 0.3s, color 0.3s;`)
  - `tests/e2e/theme.spec.js`

**Interfaces:**
- Consumes: `normalizeTheme(value)` de `src/lib/palette.js` (só no teste, para garantir a mesma regra).
- Produces: `THEME_BOOT_SCRIPT: string`, em `src/lib/themeBoot.js`.

- [ ] **Step 1: Escrever `tests/unit/theme-boot.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { THEME_BOOT_SCRIPT } from '../../src/lib/themeBoot';
import { normalizeTheme } from '../../src/lib/palette';

// Executa o script com document/localStorage falsos e devolve o data-theme aplicado
function run(stored, { blocked = false } = {}) {
  const attrs = {};
  const document = { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } };
  const localStorage = {
    getItem: () => {
      if (blocked) throw new Error('storage bloqueado');
      return stored;
    },
  };
  new Function('document', 'localStorage', THEME_BOOT_SCRIPT)(document, localStorage);
  return attrs['data-theme'];
}

describe('THEME_BOOT_SCRIPT', () => {
  it.each([null, 'day', 'light', 'night', 'dark', 'qualquer'])('valor salvo %s segue normalizeTheme', (stored) => {
    expect(run(stored)).toBe(normalizeTheme(stored));
  });

  it('storage bloqueado cai na noite', () => {
    expect(run('day', { blocked: true })).toBe('night');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- tests/unit/theme-boot.test.js`
Expected: FAIL com `Failed to resolve import "../../src/lib/themeBoot"`

- [ ] **Step 3: Criar `src/lib/themeBoot.js`**

```js
// Roda inline no <head>, antes da hidratação, para o tema salvo não piscar.
// Mesma regra de normalizeTheme (palette.js): 'day'/'light' → dia, o resto → noite.
export const THEME_BOOT_SCRIPT =
  "(function(){var t='night';try{var s=localStorage.getItem('theme');if(s==='day'||s==='light')t='day';}catch(e){}document.documentElement.setAttribute('data-theme',t);})();";
```

- [ ] **Step 4: Rodar o teste unitário**

Run: `npm test -- tests/unit/theme-boot.test.js`
Expected: PASS (7 testes)

- [ ] **Step 5: Adicionar o teste E2E ao fim de `tests/e2e/theme.spec.js`**

```js
test('o script inline aplica o tema salvo mesmo sem o React', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'day'));
  // Bloqueia os bundles: só o HTML do servidor e o script inline rodam
  await page.route('**/_next/static/chunks/**', (route) => route.abort());
  await page.goto('/certificates');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
});
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/theme.spec.js`
Expected: o teste novo FALHA (sem `data-theme`, porque o React não hidrata); os outros 2 passam.

- [ ] **Step 7: Aplicar o script em `src/app/layout.js`**

Adicionar o import depois de `import { SettingsProvider } ...`:

```js
import { THEME_BOOT_SCRIPT } from '../lib/themeBoot';
```

Trocar:

```jsx
    <html lang="pt-BR">
      <body>
```

por:

```jsx
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
```

- [ ] **Step 8: Transição 昼/夜 mais lenta em `src/app/globals.css`**

Na regra `body`, trocar:

```css
  transition: background-color 0.3s, color 0.3s;
```

por:

```css
  /* 0.8s acompanha o crossfade da cena na troca 昼/夜 */
  transition: background-color 0.8s ease, color 0.8s ease;
```

- [ ] **Step 9: Rodar os testes**

Run: `npx playwright test tests/e2e/theme.spec.js`
Expected: `3 passed`

Run: `npm test`
Expected: PASS em todos

- [ ] **Step 10: Commit**

```bash
git add src/lib/themeBoot.js tests/unit/theme-boot.test.js tests/e2e/theme.spec.js src/app/layout.js src/app/globals.css
git commit -m "Feat: Aplica o tema antes da hidratação" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Loader ensō

**Files:**
- Create: `src/lib/loader.js`, `src/components/EnsoLoader.js`, `tests/unit/loader.test.js`, `tests/e2e/loader.spec.js`
- Modify:
  - `src/lib/gsap.js`
  - `src/store/journey.js`, `tests/unit/journey-store.test.js`
  - `src/components/scene/SceneCanvas.js`, `src/components/scene/Canvas3D.js`
  - `src/app/layout.js`, `src/app/page.js`, `src/app/globals.css`
- Delete: `src/components/LoadingScreen.js`

**Interfaces:**
- Consumes: `journeyStore`, `useJourney` (store da fase 1).
- Produces:
  - Store: estado `sceneReady: boolean` e `loaderDone: boolean` (ambos `false` no início); ações `setSceneReady()` e `setLoaderDone()`.
  - `src/lib/loader.js`: `LOADER_MIN_MS = 1200`, `LOADER_MAX_MS = 4000`, `loaderProgress({ elapsed, sceneReady, minMs?, maxMs? }) => number` (0–1).
  - `src/lib/gsap.js`: passa a registrar e exportar `ScrambleTextPlugin` e `DrawSVGPlugin`.
  - `<EnsoLoader />`: overlay `[data-loader="enso"]` que some ao terminar.
  - Classe CSS `.font-jp`.

- [ ] **Step 1: Escrever `tests/unit/loader.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { loaderProgress, LOADER_MIN_MS, LOADER_MAX_MS } from '../../src/lib/loader';

describe('loaderProgress', () => {
  it('usa os tempos da spec', () => {
    expect(LOADER_MIN_MS).toBe(1200);
    expect(LOADER_MAX_MS).toBe(4000);
  });

  it.each([
    [{ elapsed: 0, sceneReady: false }, 0],
    [{ elapsed: 600, sceneReady: false }, 0.45],
    [{ elapsed: 1200, sceneReady: false }, 0.9],
    [{ elapsed: 3000, sceneReady: false }, 0.9],
    [{ elapsed: 800, sceneReady: true }, 0.6],
    [{ elapsed: 1200, sceneReady: true }, 1],
    [{ elapsed: 4000, sceneReady: false }, 1],
    // Movimento reduzido: sem espera mínima
    [{ elapsed: 0, sceneReady: true, minMs: 0 }, 1],
    [{ elapsed: 0, sceneReady: false, minMs: 0 }, 0.9],
  ])('%o → %s', (input, expected) => {
    expect(loaderProgress(input)).toBeCloseTo(expected, 6);
  });
});
```

- [ ] **Step 2: Adicionar os testes da store ao fim de `tests/unit/journey-store.test.js`**

```js
describe('loader', () => {
  it('começa com a cena e o loader pendentes', () => {
    expect(store.getState()).toMatchObject({ sceneReady: false, loaderDone: false });
  });

  it('marca cena pronta e loader concluído', () => {
    store.getState().setSceneReady();
    store.getState().setLoaderDone();
    expect(store.getState()).toMatchObject({ sceneReady: true, loaderDone: true });
  });
});
```

- [ ] **Step 3: Escrever `tests/e2e/loader.spec.js`**

```js
import { test, expect } from '@playwright/test';

const loader = (page) => page.locator('[data-loader="enso"]');

test('o ensō aparece na carga e some revelando o hero', async ({ page }) => {
  await page.goto('/');
  await expect(loader(page)).toBeVisible();
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.hero-title')).toBeVisible();
});

test('navegação no cliente não mostra o loader de novo', async ({ page }) => {
  await page.goto('/');
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
  await page.getByRole('link', { name: 'Certificados' }).first().click();
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(loader(page)).toHaveCount(0);
});

test('sem WebGL o loader também termina', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (/webgl/i.test(type)) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(loader(page)).toHaveCount(0, { timeout: 10_000 });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('o loader some sem a espera mínima', async ({ page }) => {
    await page.goto('/');
    await expect(loader(page)).toHaveCount(0, { timeout: 6_000 });
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL. `loader.test.js` não resolve `../../src/lib/loader`, e os testes de `loader` da store falham porque `sceneReady` e `loaderDone` estão `undefined`.

Run: `npx playwright test tests/e2e/loader.spec.js`
Expected: FAIL (`[data-loader="enso"]` não existe)

- [ ] **Step 5: Criar `src/lib/loader.js`**

```js
// Progresso do traço do ensō (0–1)
export const LOADER_MIN_MS = 1200;
export const LOADER_MAX_MS = 4000;

// Enquanto espera, o traço avança até 90% no tempo mínimo.
// Fecha quando a cena está pronta (e o mínimo passou) ou no tempo máximo.
export function loaderProgress({ elapsed, sceneReady, minMs = LOADER_MIN_MS, maxMs = LOADER_MAX_MS }) {
  if (elapsed >= maxMs) return 1;
  if (sceneReady && elapsed >= minMs) return 1;
  if (minMs === 0) return 0.9;
  return Math.min(0.9, (elapsed / minMs) * 0.9);
}
```

- [ ] **Step 6: Adicionar os campos na store `src/store/journey.js`**

Depois de `assetsProgress: 0,`:

```js
    sceneReady: false,
    loaderDone: false,
```

Depois da ação `setAssetsProgress`:

```js
    setSceneReady: () => set({ sceneReady: true }),
    setLoaderDone: () => set({ loaderDone: true }),
```

- [ ] **Step 7: Rodar os unitários**

Run: `npm test`
Expected: PASS em todos

- [ ] **Step 8: Registrar os plugins em `src/lib/gsap.js`**

Arquivo completo:

```js
'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useGSAP } from '@gsap/react';

// Registro único dos plugins — importe gsap daqui em vez de 'gsap' direto
gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, DrawSVGPlugin, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
```

- [ ] **Step 9: Criar `src/components/EnsoLoader.js`**

```js
'use client';
import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { journeyStore, useJourney } from '../store/journey';
import { loaderProgress } from '../lib/loader';

// Traço de pincel quase fechado (ensō), começando embaixo à esquerda
const ENSO_PATH = 'M 62 150 C 30 118 34 58 86 38 C 138 18 186 52 184 104 C 182 150 140 180 98 172';

// Só redesenha quando o progresso anda pelo menos 1%
const MIN_STEP = 0.01;

export default function EnsoLoader() {
  const loaderDone = useJourney((s) => s.loaderDone);
  const rootRef = useRef(null);
  const pathRef = useRef(null);

  useGSAP(() => {
    if (loaderDone) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const path = pathRef.current;
    const start = performance.now();
    let shown = 0;
    let finished = false;

    gsap.set(path, { drawSVG: '0%' });

    const tick = () => {
      if (finished) return;
      const progress = loaderProgress({
        elapsed: performance.now() - start,
        sceneReady: journeyStore.getState().sceneReady,
        ...(reduced ? { minMs: 0 } : {}),
      });

      if (progress < 1) {
        if (progress - shown >= MIN_STEP) {
          shown = progress;
          gsap.to(path, { drawSVG: `${progress * 100}%`, duration: 0.3, ease: 'power1.out', overwrite: true });
        }
        return;
      }

      // Fecha o círculo e dissolve o overlay
      finished = true;
      gsap.ticker.remove(tick);
      gsap
        .timeline({ onComplete: () => journeyStore.getState().setLoaderDone() })
        .to(path, { drawSVG: '100%', duration: reduced ? 0 : 0.35, ease: 'power2.out', overwrite: true })
        .to(rootRef.current, { opacity: 0, duration: reduced ? 0 : 0.6, ease: 'power2.inOut' });
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, { dependencies: [loaderDone] });

  if (loaderDone) return null;

  return (
    <div
      ref={rootRef}
      data-loader="enso"
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--bg-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Sem JavaScript o loader nunca terminaria: esconde */}
      <noscript>
        <style>{'[data-loader="enso"]{display:none}'}</style>
      </noscript>
      <svg viewBox="0 0 220 220" width="180" height="180">
        <path ref={pathRef} d={ENSO_PATH} fill="none" stroke="var(--ink)" strokeWidth="12" strokeLinecap="round" />
        <text x="110" y="122" textAnchor="middle" fontSize="34" fill="var(--ink)" className="font-jp">
          奥山
        </text>
      </svg>
    </div>
  );
}
```

- [ ] **Step 10: Adicionar a classe `.font-jp` em `src/app/globals.css`**

Logo depois da regra `a { text-decoration: none; color: inherit; }`:

```css
/* Kana/kanji decorativos: fontes japonesas do sistema, sem download */
.font-jp {
  font-family: 'Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', 'Noto Serif JP', serif;
}
```

- [ ] **Step 11: Avisar quando a cena está pronta**

Em `src/components/scene/Canvas3D.js`, no `<Canvas`, adicionar a prop, junto de `flat`:

```jsx
      onCreated={() => journeyStore.getState().setSceneReady()}
```

(`journeyStore` já está importado nesse arquivo.)

Em `src/components/scene/SceneCanvas.js`, trocar o import:

```js
import { useJourney } from '../../store/journey';
```

por:

```js
import { journeyStore, useJourney } from '../../store/journey';
```

E, logo depois do `useEffect` que chama `setWebgl(hasWebGL())`, adicionar:

```js
  // O fundo estático também conta como cena pronta para o loader
  useEffect(() => {
    if (webgl === false || failed) journeyStore.getState().setSceneReady();
  }, [webgl, failed]);
```

- [ ] **Step 12: Montar o loader em `src/app/layout.js`**

Adicionar o import junto dos imports de componentes:

```js
import EnsoLoader from '../components/EnsoLoader';
```

E, dentro de `<SettingsProvider>`, logo depois de `<SceneCanvas />`:

```jsx
          <EnsoLoader />
```

- [ ] **Step 13: Remover o `LoadingScreen` da home em `src/app/page.js`**

1. Trocar o import de hooks:

```js
import { useState, useEffect, useRef } from 'react';
```

por:

```js
import { useRef } from 'react';
```

2. Remover a linha `import LoadingScreen from '../components/LoadingScreen';`.

3. Adicionar, depois de `import Section from '../components/journey/Section';`:

```js
import { useJourney } from '../store/journey';
```

4. Remover `const [isLoading, setIsLoading] = useState(true);`.

5. Remover o bloco inteiro:

```js
  useEffect(() => {
    if (!isLoading) {
      window.scrollTo(0, 0);
      setTimeout(() => window.scrollTo(0, 0), 10);
    }
  }, [isLoading]);
```

6. Trocar o bloco da animação:

```js
  // Nome letra a letra + indicador de scroll
  useGSAP(() => {
    if (isLoading) return;
    gsap.from('.hero-title span', { opacity: 0, duration: 0.3, stagger: 0.08 });
    gsap.from('.hero-scroll', { opacity: 0, delay: 1, duration: 0.5 });
    gsap.to('.hero-scroll-arrow', { keyframes: { y: [0, 10, 0], easeEach: 'sine.inOut' }, duration: 2, repeat: -1 });
  }, { scope: heroRef, dependencies: [isLoading] });

  if (isLoading) return <LoadingScreen onComplete={() => setIsLoading(false)} />;
```

por:

```js
  const loaderDone = useJourney((s) => s.loaderDone);

  // Entrada do hero quando o ensō termina
  useGSAP(() => {
    if (!loaderDone) return;
    gsap.from('.hero-title span', { opacity: 0, duration: 0.3, stagger: 0.08 });
    gsap.from('.hero-scroll', { opacity: 0, delay: 1, duration: 0.5 });
    gsap.to('.hero-scroll-arrow', { keyframes: { y: [0, 10, 0], easeEach: 'sine.inOut' }, duration: 2, repeat: -1 });
  }, { scope: heroRef, dependencies: [loaderDone] });
```

- [ ] **Step 14: Apagar o componente antigo**

```bash
git rm src/components/LoadingScreen.js
```

- [ ] **Step 15: Rodar os testes**

Run: `npx playwright test tests/e2e/loader.spec.js`
Expected: `4 passed`

Run: `npm test && npm run test:e2e`
Expected: tudo passa

- [ ] **Step 16: Commit**

```bash
git add src/lib/loader.js src/components/EnsoLoader.js tests/unit/loader.test.js tests/unit/journey-store.test.js tests/e2e/loader.spec.js src/lib/gsap.js src/store/journey.js src/components/scene/SceneCanvas.js src/components/scene/Canvas3D.js src/app/layout.js src/app/page.js src/app/globals.css
git commit -m "Feat: Adiciona loader ensō com DrawSVG" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Nome do hero em ScrambleText

**Files:**
- Create: `src/lib/hero/name.js`, `tests/unit/hero-name.test.js`, `tests/e2e/hero.spec.js`
- Modify: `src/app/page.js` (h1 do hero e bloco `useGSAP` da entrada), `src/app/globals.css`

**Interfaces:**
- Consumes:
  - `profile` de `src/data/resume.js`: `{ name, nameKanji, nameKatakana }`.
  - `loaderDone` da store (Task 2).
  - `ScrambleTextPlugin` registrado em `src/lib/gsap.js` (Task 2).
- Produces:
  - `src/lib/hero/name.js`: `SCRAMBLE_CHARS: string`, `NAME_HOLD_SECONDS = 3.5`, `NAME_SCRAMBLE_SECONDS = 1.4`, `buildNameSequence(profile) => string[]` (ordem: katakana, kanji, latino).
  - DOM: `<h1 class="hero-title">` contém `<span class="sr-only">` com o nome latino e `<span class="hero-name" aria-hidden="true">` animado.

- [ ] **Step 1: Escrever `tests/unit/hero-name.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { buildNameSequence, SCRAMBLE_CHARS, NAME_HOLD_SECONDS, NAME_SCRAMBLE_SECONDS } from '../../src/lib/hero/name';
import { profile } from '../../src/data/resume';

describe('buildNameSequence', () => {
  it('cicla katakana → kanji e volta ao latino', () => {
    expect(buildNameSequence(profile)).toEqual([
      'ラファエル ノブユキ ハガ オクヤマ',
      'ラファエル 信幸 芳賀 奥山',
      'Raphael Nobuyuki Haga Okuyama',
    ]);
  });
});

describe('constantes', () => {
  it('tempos do ciclo', () => {
    expect(NAME_HOLD_SECONDS).toBe(3.5);
    expect(NAME_SCRAMBLE_SECONDS).toBe(1.4);
  });

  it('caracteres do scramble são só katakana', () => {
    expect(SCRAMBLE_CHARS.length).toBeGreaterThan(20);
    expect(SCRAMBLE_CHARS).toMatch(/^[゠-ヿ]+$/);
  });
});
```

- [ ] **Step 2: Escrever `tests/e2e/hero.spec.js`**

```js
import { test, expect } from '@playwright/test';

const LATIN = 'Raphael Nobuyuki Haga Okuyama';

test('o h1 acessível mantém o nome latino', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: LATIN })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.hero-name')).toHaveAttribute('aria-hidden', 'true');
});

test('o nome visível cicla por katakana e kanji', async ({ page }) => {
  await page.goto('/');
  const name = page.locator('.hero-name');
  await expect(name).toHaveText('ラファエル ノブユキ ハガ オクヤマ', { timeout: 15_000 });
  await expect(name).toHaveText('ラファエル 信幸 芳賀 奥山', { timeout: 15_000 });
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('o nome fica no latino, sem ciclo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-loader="enso"]')).toHaveCount(0, { timeout: 6_000 });
    await page.waitForTimeout(7_000);
    await expect(page.locator('.hero-name')).toHaveText(LATIN);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- tests/unit/hero-name.test.js`
Expected: FAIL com `Failed to resolve import "../../src/lib/hero/name"`

Run: `npx playwright test tests/e2e/hero.spec.js`
Expected: FAIL (`.hero-name` não existe)

- [ ] **Step 4: Criar `src/lib/hero/name.js`**

```js
// Ciclo do nome no hero (ScrambleText): latino → katakana → kanji → latino...

// Caracteres que "embaralham" durante a troca
export const SCRAMBLE_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン';

export const NAME_HOLD_SECONDS = 3.5;
export const NAME_SCRAMBLE_SECONDS = 1.4;

// O hero começa no nome latino; a sequência é o que vem depois, terminando nele de novo
export function buildNameSequence(profile) {
  return [profile.nameKatakana, profile.nameKanji, profile.name];
}
```

- [ ] **Step 5: Rodar o teste unitário**

Run: `npm test -- tests/unit/hero-name.test.js`
Expected: PASS

- [ ] **Step 6: Trocar o h1 do hero em `src/app/page.js`**

Trocar:

```jsx
          <h1 className="hero-title">
            {nameText.split("").map((char, index) => (
              <span key={index}>{char}</span>
            ))}
          </h1>
```

por:

```jsx
          <h1 className="hero-title">
            {/* Leitores de tela e SEO sempre recebem o nome latino */}
            <span className="sr-only">{nameText}</span>
            <span className="hero-name" aria-hidden="true">{nameText}</span>
          </h1>
```

- [ ] **Step 7: Trocar a animação de entrada em `src/app/page.js`**

Adicionar o import depois de `import { useJourney } from '../store/journey';`:

```js
import { buildNameSequence, SCRAMBLE_CHARS, NAME_HOLD_SECONDS, NAME_SCRAMBLE_SECONDS } from '../lib/hero/name';
```

Trocar o bloco:

```js
  // Entrada do hero quando o ensō termina
  useGSAP(() => {
    if (!loaderDone) return;
    gsap.from('.hero-title span', { opacity: 0, duration: 0.3, stagger: 0.08 });
    gsap.from('.hero-scroll', { opacity: 0, delay: 1, duration: 0.5 });
    gsap.to('.hero-scroll-arrow', { keyframes: { y: [0, 10, 0], easeEach: 'sine.inOut' }, duration: 2, repeat: -1 });
  }, { scope: heroRef, dependencies: [loaderDone] });
```

por:

```js
  // Entrada do hero quando o ensō termina; depois o nome cicla latino → katakana → kanji
  useGSAP(() => {
    if (!loaderDone) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.from('.hero-name', { opacity: 0, y: 12, duration: reduced ? 0 : 0.8, ease: 'power2.out' });
    gsap.from('.hero-scroll', { opacity: 0, delay: reduced ? 0 : 1, duration: reduced ? 0 : 0.5 });
    if (reduced) return;

    gsap.to('.hero-scroll-arrow', { keyframes: { y: [0, 10, 0], easeEach: 'sine.inOut' }, duration: 2, repeat: -1 });

    const cycle = gsap.timeline({ repeat: -1, delay: NAME_HOLD_SECONDS });
    buildNameSequence(profile).forEach((text) => {
      cycle
        .to('.hero-name', {
          duration: NAME_SCRAMBLE_SECONDS,
          scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5, revealDelay: 0.3 },
        })
        .to({}, { duration: NAME_HOLD_SECONDS });
    });
  }, { scope: heroRef, dependencies: [loaderDone] });
```

- [ ] **Step 8: Estilos em `src/app/globals.css`**

Depois da regra `.font-jp { ... }` (Task 2):

```css
/* Visível só para leitores de tela */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Nome do hero: latim na Inter, kana/kanji nas fontes japonesas do sistema */
.hero-name {
  display: inline-block;
  font-family: 'Inter', 'Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', 'Noto Serif JP', serif;
}
```

- [ ] **Step 9: Rodar os testes**

Run: `npx playwright test tests/e2e/hero.spec.js`
Expected: `3 passed`

Run: `npm test && npm run test:e2e`
Expected: tudo passa. O smoke `home carrega com o nome no hero` continua passando pelo `.sr-only`.

- [ ] **Step 10: Commit**

```bash
git add src/lib/hero tests/unit/hero-name.test.js tests/e2e/hero.spec.js src/app/page.js src/app/globals.css
git commit -m "Feat: Anima o nome do hero em katakana e kanji com ScrambleText" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Pétalas de sakura

**Files:**
- Create:
  - `src/lib/pointer.js`, `src/lib/journey/petals.js`
  - `src/components/scene/Petals.js`
  - `tests/unit/pointer.test.js`, `tests/unit/petals.test.js`
- Modify:
  - `src/lib/palette.js` (+`SCENE_ACCENTS`), `tests/unit/palette.test.js`
  - `src/components/scene/World.js`, `src/components/scene/Canvas3D.js`

**Interfaces:**
- Consumes:
  - `mulberry32(seed)` de `src/lib/journey/ridge.js`.
  - `clamp01` de `src/lib/journey/season.js`.
  - `QUALITY_SETTINGS` de `src/lib/journey/quality.js`.
  - `journeyStore`, `useJourney`.
- Produces:
  - `src/lib/pointer.js`: `pointer = { x, y, active }` (NDC −1..1, y para cima), `toNdc(clientX, clientY, width, height) => { x, y }`, `trackPointer() => cleanup`.
  - `src/lib/journey/petals.js`: `PETAL_VOLUME = { x: [-18, 18], y: [-2, 14], z: [-6, 22] }`, `createPetalData(count, seed = 7, volume = PETAL_VOLUME) => { offsets: Float32Array(count*3), params: Float32Array(count*3) }`, `petalOpacity(seasonMix) => number`.
  - `src/lib/palette.js`: `SCENE_ACCENTS = { night: Accents, day: Accents }`, onde `Accents = { petal, torii, toriiTop, celestial }` (hex).

- [ ] **Step 1: Escrever `tests/unit/pointer.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { toNdc } from '../../src/lib/pointer';

describe('toNdc', () => {
  it.each([
    [[0, 0, 800, 600], { x: -1, y: 1 }],
    [[800, 600, 800, 600], { x: 1, y: -1 }],
    [[400, 300, 800, 600], { x: 0, y: 0 }],
    [[200, 450, 800, 600], { x: -0.5, y: -0.5 }],
  ])('%j → %o', (args, expected) => {
    const r = toNdc(...args);
    expect(r.x).toBeCloseTo(expected.x, 6);
    expect(r.y).toBeCloseTo(expected.y, 6);
  });
});
```

- [ ] **Step 2: Escrever `tests/unit/petals.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createPetalData, petalOpacity, PETAL_VOLUME } from '../../src/lib/journey/petals';

describe('createPetalData', () => {
  it('gera 3 valores de posição e 3 parâmetros por pétala', () => {
    const { offsets, params } = createPetalData(50);
    expect(offsets).toBeInstanceOf(Float32Array);
    expect(offsets).toHaveLength(150);
    expect(params).toHaveLength(150);
  });

  it('posições ficam dentro do volume', () => {
    const { offsets } = createPetalData(200);
    for (let i = 0; i < 200; i++) {
      expect(offsets[i * 3]).toBeGreaterThanOrEqual(PETAL_VOLUME.x[0]);
      expect(offsets[i * 3]).toBeLessThanOrEqual(PETAL_VOLUME.x[1]);
      expect(offsets[i * 3 + 1]).toBeGreaterThanOrEqual(PETAL_VOLUME.y[0]);
      expect(offsets[i * 3 + 1]).toBeLessThanOrEqual(PETAL_VOLUME.y[1]);
      expect(offsets[i * 3 + 2]).toBeGreaterThanOrEqual(PETAL_VOLUME.z[0]);
      expect(offsets[i * 3 + 2]).toBeLessThanOrEqual(PETAL_VOLUME.z[1]);
    }
  });

  it('parâmetros: fase em [0, 2π), queda em [0.4, 1), giro em [0.5, 2)', () => {
    const { params } = createPetalData(200);
    for (let i = 0; i < 200; i++) {
      expect(params[i * 3]).toBeGreaterThanOrEqual(0);
      expect(params[i * 3]).toBeLessThan(Math.PI * 2);
      expect(params[i * 3 + 1]).toBeGreaterThanOrEqual(0.4);
      expect(params[i * 3 + 1]).toBeLessThan(1);
      expect(params[i * 3 + 2]).toBeGreaterThanOrEqual(0.5);
      expect(params[i * 3 + 2]).toBeLessThan(2);
    }
  });

  it('é determinístico pela seed', () => {
    expect(createPetalData(20, 3)).toEqual(createPetalData(20, 3));
    expect(createPetalData(20, 3).offsets).not.toEqual(createPetalData(20, 4).offsets);
  });
});

describe('petalOpacity', () => {
  it.each([[0, 1], [0.4, 0.5], [0.8, 0], [2, 0]])('mix %s → %s', (mix, expected) => {
    expect(petalOpacity(mix)).toBeCloseTo(expected, 6);
  });
});
```

- [ ] **Step 3: Adicionar o teste de `SCENE_ACCENTS` em `tests/unit/palette.test.js`**

Trocar a linha de import:

```js
import { THEMES, SEASONS, normalizeTheme } from '../../src/lib/palette';
```

por:

```js
import { THEMES, SEASONS, SCENE_ACCENTS, normalizeTheme } from '../../src/lib/palette';
```

E adicionar ao fim do arquivo:

```js
describe('SCENE_ACCENTS', () => {
  it('os dois temas têm pétala, torii, topo do torii e astro em hex', () => {
    for (const theme of ['night', 'day']) {
      expect(Object.keys(SCENE_ACCENTS[theme]).sort()).toEqual(['celestial', 'petal', 'torii', 'toriiTop']);
      Object.values(SCENE_ACCENTS[theme]).forEach((c) => expect(c).toMatch(HEX));
    }
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL. `pointer` e `petals` não resolvem, e `SCENE_ACCENTS` está `undefined`.

- [ ] **Step 5: Criar `src/lib/pointer.js`**

```js
// Ponteiro em coordenadas normalizadas (-1..1, y para cima), lido pela cena sem re-render
export const pointer = { x: 0, y: 0, active: false };

export function toNdc(clientX, clientY, width, height) {
  return { x: (clientX / width) * 2 - 1, y: -((clientY / height) * 2 - 1) };
}

export function trackPointer() {
  const onMove = (e) => {
    const { x, y } = toNdc(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  };
  const onLeave = () => {
    pointer.active = false;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
  };
}
```

- [ ] **Step 6: Criar `src/lib/journey/petals.js`**

```js
import { mulberry32 } from './ridge';
import { clamp01 } from './season';

// Volume onde as pétalas caem, em volta do começo do caminho da câmera
export const PETAL_VOLUME = { x: [-18, 18], y: [-2, 14], z: [-6, 22] };

const lerp = (a, b, t) => a + (b - a) * t;

// Por pétala: posição inicial (offsets) e [fase, velocidade de queda, velocidade de giro] (params)
export function createPetalData(count, seed = 7, volume = PETAL_VOLUME) {
  const rand = mulberry32(seed);
  const offsets = new Float32Array(count * 3);
  const params = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    offsets[i * 3] = lerp(volume.x[0], volume.x[1], rand());
    offsets[i * 3 + 1] = lerp(volume.y[0], volume.y[1], rand());
    offsets[i * 3 + 2] = lerp(volume.z[0], volume.z[1], rand());
    params[i * 3] = rand() * Math.PI * 2;
    params[i * 3 + 1] = 0.4 + rand() * 0.6;
    params[i * 3 + 2] = 0.5 + rand() * 1.5;
  }
  return { offsets, params };
}

// Pétalas só na primavera: somem até o meio do caminho para o verão
export function petalOpacity(seasonMix) {
  return 1 - clamp01(seasonMix / 0.8);
}
```

- [ ] **Step 7: Adicionar `SCENE_ACCENTS` em `src/lib/palette.js`**

Depois do objeto `SEASONS` (antes de `normalizeTheme`):

```js
// Elementos decorativos da cena (não ficam atrás de texto corrido)
export const SCENE_ACCENTS = {
  night: { petal: '#d99bb0', torii: '#8f2a23', toriiTop: '#0b0d14', celestial: '#f3ead2' },
  day: { petal: '#f0a8bd', torii: '#c23b30', toriiTop: '#1f1d1a', celestial: '#f7e3b5' },
};
```

- [ ] **Step 8: Rodar os unitários**

Run: `npm test`
Expected: PASS em todos

- [ ] **Step 9: Criar `src/components/scene/Petals.js`**

```js
'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, InstancedBufferAttribute, PlaneGeometry, Vector2, Vector3 } from 'three';
import { journeyStore, useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { createPetalData, petalOpacity, PETAL_VOLUME } from '../../lib/journey/petals';
import { SCENE_ACCENTS } from '../../lib/palette';
import { pointer } from '../../lib/pointer';

const vertexShader = /* glsl */ `
  attribute vec3 aOffset;
  attribute vec3 aParams; // fase, queda, giro
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerActive;
  uniform vec3 uVolumeMin;
  uniform vec3 uVolumeSize;
  varying vec2 vUv;
  varying float vShade;

  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    float t = uTime * aParams.y;

    // Queda com vento: desce, deriva em x e oscila; volta ao topo ao sair do volume
    vec3 p = aOffset;
    p.y = uVolumeMin.y + mod(p.y - uVolumeMin.y - t * 1.2, uVolumeSize.y);
    p.x = uVolumeMin.x + mod(p.x - uVolumeMin.x + t * 0.8 + sin(t + aParams.x) * 0.6, uVolumeSize.x);
    p.z += cos(t * 0.7 + aParams.x) * 0.4;

    // Giro da pétala em torno do próprio centro
    vec3 local = position;
    local.xy = rot(t * aParams.z + aParams.x) * local.xy;
    local.yz = rot(t * aParams.z * 0.7) * local.yz;

    vUv = uv;
    vShade = 0.75 + 0.25 * sin(aParams.x + t);

    vec4 clip = projectionMatrix * modelViewMatrix * vec4(p + local, 1.0);

    // Afasta do cursor em espaço de tela
    vec2 away = clip.xy / clip.w - uPointer;
    float push = uPointerActive * smoothstep(0.25, 0.0, length(away)) * 0.12;
    clip.xy += normalize(away + 1e-5) * push * clip.w;

    gl_Position = clip;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    // Elipse suave no quad
    vec2 q = vUv * 2.0 - 1.0;
    float shape = 1.0 - smoothstep(0.8, 1.0, length(q * vec2(1.0, 1.4)));
    if (shape < 0.01) discard;
    gl_FragColor = vec4(uColor * vShade, shape * uOpacity);
    #include <colorspace_fragment>
  }
`;

// Sakura instanciada: cai na primavera e foge do cursor
export default function Petals() {
  const quality = useJourney((s) => s.quality);
  const count = QUALITY_SETTINGS[quality].particles;
  const meshRef = useRef(null);
  const materialRef = useRef(null);

  const geometry = useMemo(() => {
    const g = new PlaneGeometry(0.22, 0.16);
    const { offsets, params } = createPetalData(count);
    g.setAttribute('aOffset', new InstancedBufferAttribute(offsets, 3));
    g.setAttribute('aParams', new InstancedBufferAttribute(params, 3));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new Vector2() },
      uPointerActive: { value: 0 },
      uVolumeMin: { value: new Vector3(PETAL_VOLUME.x[0], PETAL_VOLUME.y[0], PETAL_VOLUME.z[0]) },
      uVolumeSize: {
        value: new Vector3(
          PETAL_VOLUME.x[1] - PETAL_VOLUME.x[0],
          PETAL_VOLUME.y[1] - PETAL_VOLUME.y[0],
          PETAL_VOLUME.z[1] - PETAL_VOLUME.z[0],
        ),
      },
      uColor: { value: new Color() },
      uOpacity: { value: 1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { theme, seasonMix, reducedMotion } = journeyStore.getState();
    const opacity = petalOpacity(seasonMix);
    mesh.visible = opacity > 0.001;
    if (!mesh.visible) return;

    uniforms.uOpacity.value = opacity;
    uniforms.uColor.value.set(SCENE_ACCENTS[theme].petal);
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    uniforms.uPointerActive.value = pointer.active ? 1 : 0;
    if (!reducedMotion) uniforms.uTime.value += delta;
  });

  return (
    <instancedMesh key={count} ref={meshRef} args={[geometry, null, count]} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        args={[{ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, side: DoubleSide }]}
      />
    </instancedMesh>
  );
}
```

- [ ] **Step 10: Montar as pétalas em `src/components/scene/World.js`**

Adicionar o import depois de `import MountainLayers from './MountainLayers';`:

```js
import Petals from './Petals';
```

E, no JSX, depois de `<MountainLayers />`:

```jsx
      <Petals />
```

- [ ] **Step 11: Rastrear o ponteiro em `src/components/scene/Canvas3D.js`**

Adicionar o import depois de `import World from './World';`:

```js
import { trackPointer } from '../../lib/pointer';
```

E, logo depois do `useEffect` do `visibilitychange`:

```js
  useEffect(() => trackPointer(), []);
```

- [ ] **Step 12: Rodar toda a suíte**

Run: `npm test && npm run test:e2e`
Expected: tudo passa, e o `scene.spec.js` segue sem erros de console (inclusive de compilação de shader).

- [ ] **Step 13: Commit**

```bash
git add src/lib/pointer.js src/lib/journey/petals.js src/lib/palette.js src/components/scene/Petals.js src/components/scene/World.js src/components/scene/Canvas3D.js tests/unit/pointer.test.js tests/unit/petals.test.js tests/unit/palette.test.js
git commit -m "Feat: Adiciona pétalas de sakura com vento e desvio do cursor" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Torii, sol/lua e toggle 昼/夜 animado

**Files:**
- Create: `src/components/scene/Torii.js`, `src/components/scene/Celestial.js`
- Modify:
  - `src/components/scene/config.js` (+`TORII`, `CELESTIAL`)
  - `src/components/scene/World.js`
  - `src/components/Navbar.js` (botões de tema, linhas com `toggleTheme`)

**Interfaces:**
- Consumes: `SCENE_ACCENTS` (Task 4); `journeyStore`; `CAMERA_PATH` (a câmera passa em x ≈ 0, y ≈ 6 quando cruza z = 14).
- Produces:
  - `TORII = { position: [0, -1, 14], pillarHeight: 10, pillarRadius: 0.35, span: 7, kasagiY: 9.6, nukiY: 8.0 }`
  - `CELESTIAL = { position: [-14, 22, -90], radius: 4 }`
  - Componentes `<Torii />` e `<Celestial />`.

Não há teste unitário: são peças visuais sem lógica pura. A verificação é o E2E da cena (sem erros de console) mais a checagem visual da Task 7.

- [ ] **Step 1: Adicionar a configuração em `src/components/scene/config.js`**

Ao fim do arquivo:

```js
// Torii em primeiro plano: a câmera passa por baixo do nuki no começo da jornada
// (em z = 14 a câmera está em y ≈ 6; o nuki fica em y = -1 + 8 = 7)
export const TORII = {
  position: [0, -1, 14],
  pillarHeight: 10,
  pillarRadius: 0.35,
  span: 7,
  kasagiY: 9.6,
  nukiY: 8.0,
};

// Sol (昼) / lua (夜) no céu, visível do começo do caminho
export const CELESTIAL = { position: [-14, 22, -90], radius: 4 };
```

- [ ] **Step 2: Criar `src/components/scene/Torii.js`**

```js
'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MeshBasicMaterial } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { TORII } from './config';

// Torii procedural: dois pilares, nuki (viga de baixo), shimaki + kasagi (topo escuro)
export default function Torii() {
  const body = useMemo(() => new MeshBasicMaterial(), []);
  const top = useMemo(() => new MeshBasicMaterial(), []);
  const target = useMemo(() => ({ body: new Color(), top: new Color() }), []);
  const initialized = useRef(false);

  useEffect(
    () => () => {
      body.dispose();
      top.dispose();
    },
    [body, top],
  );

  useFrame((state, delta) => {
    const { theme } = journeyStore.getState();
    target.body.set(SCENE_ACCENTS[theme].torii);
    target.top.set(SCENE_ACCENTS[theme].toriiTop);
    // Primeiro frame aplica direto; depois acompanha o crossfade 昼/夜
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;
    body.color.lerp(target.body, k);
    top.color.lerp(target.top, k);
    const c = body.color;
    if (Math.abs(c.r - target.body.r) + Math.abs(c.g - target.body.g) + Math.abs(c.b - target.body.b) > 0.002) {
      state.invalidate();
    }
  });

  const { position, pillarHeight, pillarRadius, span, kasagiY, nukiY } = TORII;
  const half = span / 2;

  return (
    <group position={position}>
      {[-half, half].map((x) => (
        <mesh key={x} position={[x, pillarHeight / 2, 0]} material={body}>
          <cylinderGeometry args={[pillarRadius * 0.9, pillarRadius, pillarHeight, 16]} />
        </mesh>
      ))}
      <mesh position={[0, nukiY, 0]} material={body}>
        <boxGeometry args={[span + 0.8, 0.35, 0.4]} />
      </mesh>
      <mesh position={[0, (kasagiY + nukiY) / 2, 0]} material={body}>
        <boxGeometry args={[0.35, kasagiY - nukiY - 0.5, 0.3]} />
      </mesh>
      <mesh position={[0, kasagiY - 0.45, 0]} material={body}>
        <boxGeometry args={[span + 1.6, 0.35, 0.6]} />
      </mesh>
      <mesh position={[0, kasagiY, 0]} material={top}>
        <boxGeometry args={[span + 2.4, 0.5, 0.7]} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 3: Criar `src/components/scene/Celestial.js`**

```js
'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import { journeyStore } from '../../store/journey';
import { SCENE_ACCENTS } from '../../lib/palette';
import { CELESTIAL } from './config';

// Opacidade do disco e do halo por tema: a lua brilha mais que o sol pálido
const OPACITY = { night: { disc: 1, halo: 0.18 }, day: { disc: 0.55, halo: 0.1 } };

// Sol (昼) / lua (夜): disco com halo, fora da névoa
export default function Celestial() {
  const discRef = useRef(null);
  const haloRef = useRef(null);
  const target = useMemo(() => new Color(), []);
  const initialized = useRef(false);

  useFrame((state, delta) => {
    const disc = discRef.current;
    const halo = haloRef.current;
    if (!disc || !halo) return;
    const { theme } = journeyStore.getState();
    target.set(SCENE_ACCENTS[theme].celestial);
    const k = initialized.current ? 1 - Math.exp(-delta * 4) : 1;
    initialized.current = true;

    disc.color.lerp(target, k);
    halo.color.copy(disc.color);
    disc.opacity += (OPACITY[theme].disc - disc.opacity) * k;
    halo.opacity += (OPACITY[theme].halo - halo.opacity) * k;

    if (Math.abs(disc.opacity - OPACITY[theme].disc) > 0.002) state.invalidate();
  });

  return (
    <group position={CELESTIAL.position}>
      <mesh>
        <circleGeometry args={[CELESTIAL.radius * 2.2, 48]} />
        <meshBasicMaterial ref={haloRef} transparent opacity={0} fog={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[CELESTIAL.radius, 48]} />
        <meshBasicMaterial ref={discRef} transparent opacity={0} fog={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Montar em `src/components/scene/World.js`**

Adicionar os imports depois de `import Petals from './Petals';`:

```js
import Torii from './Torii';
import Celestial from './Celestial';
```

O JSX fica:

```jsx
    <>
      <Atmosphere />
      <JourneyCamera />
      <Celestial />
      <MountainLayers />
      <Torii />
      <Petals />
    </>
```

- [ ] **Step 5: Animar o ícone do toggle em `src/components/Navbar.js`**

1. Adicionar um ref depois de `const menuRef = useRef(null);`:

```js
  const navRef = useRef(null);
```

2. Logo depois da linha `const themeLabel = ...`:

```js
  // Ícone do toggle 昼/夜 gira e entra ao trocar de tema
  useGSAP(() => {
    gsap.fromTo(
      '.theme-icon',
      { rotate: -90, scale: 0.6, opacity: 0 },
      { rotate: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
    );
  }, { scope: navRef, dependencies: [theme], revertOnUpdate: true });
```

3. Envolver o JSX retornado num contêiner com o ref. Trocar a abertura `<>` do `return (` por:

```jsx
    <div ref={navRef} style={{ display: 'contents' }}>
```

e o fechamento `</>` correspondente, no fim do `return`, por `</div>`.

4. Botão desktop, trocar:

```jsx
{theme === 'night' ? <Sun size={20} /> : <Moon size={20} />}
```

por:

```jsx
<span className="theme-icon" style={{ display: 'inline-flex' }}>{theme === 'night' ? <Sun size={20} /> : <Moon size={20} />}</span>
```

5. Botão mobile, trocar:

```jsx
{theme === 'night' ? <Sun size={24} /> : <Moon size={24} />}
```

por:

```jsx
<span className="theme-icon" style={{ display: 'inline-flex' }}>{theme === 'night' ? <Sun size={24} /> : <Moon size={24} />}</span>
```

- [ ] **Step 6: Rodar toda a suíte**

Run: `npm test && npm run test:e2e`
Expected: tudo passa (o theme.spec e o scene.spec seguem verdes, sem erros de console)

- [ ] **Step 7: Commit**

```bash
git add src/components/scene/config.js src/components/scene/Torii.js src/components/scene/Celestial.js src/components/scene/World.js src/components/Navbar.js
git commit -m "Feat: Adiciona torii, sol e lua e anima o toggle dia/noite" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Cursor de tinta

**Files:**
- Create: `src/lib/cursor/trail.js`, `src/components/InkCursor.js`, `tests/unit/trail.test.js`, `tests/e2e/cursor.spec.js`
- Modify: `src/app/layout.js`
- Delete: `src/components/CustomCursor.js`

**Interfaces:**
- Consumes: `gsap` de `src/lib/gsap.js`; token CSS `--ink` (fase 1).
- Produces:
  - `src/lib/cursor/trail.js`: `TRAIL_TTL_MS = 260`, `pruneTrail(points, now, ttl?) => points`, `trailWidth(index, length, maxWidth) => number`.
  - DOM: `[data-cursor="ink"]` (ponto, `data-hover="true|false"`) e `[data-cursor-trail]` (canvas do rastro).

- [ ] **Step 1: Escrever `tests/unit/trail.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { pruneTrail, trailWidth, TRAIL_TTL_MS } from '../../src/lib/cursor/trail';

describe('pruneTrail', () => {
  it('remove pontos mais velhos que o TTL e mantém a ordem', () => {
    const points = [{ x: 0, y: 0, t: 0 }, { x: 1, y: 1, t: 100 }, { x: 2, y: 2, t: 300 }];
    expect(TRAIL_TTL_MS).toBe(260);
    expect(pruneTrail(points, 300)).toEqual([{ x: 1, y: 1, t: 100 }, { x: 2, y: 2, t: 300 }]);
    expect(pruneTrail(points, 1000)).toEqual([]);
  });

  it('aceita TTL customizado', () => {
    expect(pruneTrail([{ x: 0, y: 0, t: 0 }], 50, 40)).toEqual([]);
  });
});

describe('trailWidth', () => {
  it('afina no fim do rastro e engrossa perto do ponteiro', () => {
    expect(trailWidth(0, 5, 10)).toBeCloseTo(1.5, 6);
    expect(trailWidth(4, 5, 10)).toBeCloseTo(10, 6);
    expect(trailWidth(2, 5, 10)).toBeCloseTo(5.75, 6);
  });

  it('rastro de um ponto usa a espessura máxima', () => {
    expect(trailWidth(0, 1, 10)).toBe(10);
  });
});
```

- [ ] **Step 2: Escrever `tests/e2e/cursor.spec.js`**

```js
import { test, expect, devices } from '@playwright/test';

test('cursor de tinta aparece com rastro e cresce sobre links', async ({ page }) => {
  await page.goto('/certificates');
  const dot = page.locator('[data-cursor="ink"]');
  await expect(dot).toHaveCount(1);
  await expect(page.locator('[data-cursor-trail]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Projetos' }).first().hover();
  await expect(dot).toHaveAttribute('data-hover', 'true');
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('mantém o ponto e tira o rastro', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.locator('[data-cursor="ink"]')).toHaveCount(1);
    await expect(page.locator('[data-cursor-trail]')).toHaveCount(0);
  });
});

test.describe('em celular', () => {
  test.use({ ...devices['Pixel 7'] });

  test('não mostra o cursor customizado', async ({ page }) => {
    await page.goto('/certificates');
    await expect(page.locator('.responsive-title')).toBeVisible();
    await expect(page.locator('[data-cursor="ink"]')).toHaveCount(0);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- tests/unit/trail.test.js`
Expected: FAIL com `Failed to resolve import "../../src/lib/cursor/trail"`

Run: `npx playwright test tests/e2e/cursor.spec.js`
Expected: os 2 primeiros FALHAM (`[data-cursor="ink"]` não existe). O de celular pode passar desde já.

- [ ] **Step 4: Criar `src/lib/cursor/trail.js`**

```js
// Rastro de pincel do cursor: pontos recentes com timestamp
export const TRAIL_TTL_MS = 260;

export function pruneTrail(points, now, ttl = TRAIL_TTL_MS) {
  return points.filter((p) => now - p.t <= ttl);
}

// Fino no fim do rastro (15% da espessura), cheio perto do ponteiro
export function trailWidth(index, length, maxWidth) {
  if (length < 2) return maxWidth;
  return maxWidth * (0.15 + 0.85 * (index / (length - 1)));
}
```

- [ ] **Step 5: Rodar o unitário**

Run: `npm test -- tests/unit/trail.test.js`
Expected: PASS

- [ ] **Step 6: Criar `src/components/InkCursor.js`**

```js
'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from '../lib/gsap';
import { pruneTrail, trailWidth } from '../lib/cursor/trail';

const DOT_SIZE = 10;
const TRAIL_MAX_WIDTH = 6;

function isInteractive(target) {
  return Boolean(target?.closest?.('a, button, input, textarea, select, [role="button"]'));
}

function readInk() {
  return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
}

// Ponto de tinta que segue o mouse, com rastro de pincel e crescimento sobre links
export default function InkCursor() {
  const [enabled, setEnabled] = useState(false);
  const [withTrail, setWithTrail] = useState(false);
  const dotRef = useRef(null);
  const canvasRef = useRef(null);

  // Só em mouse/trackpad; sem rastro com movimento reduzido
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine) and (min-width: 768px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setEnabled(fine.matches);
      setWithTrail(fine.matches && !reduced.matches);
    };
    apply();
    fine.addEventListener('change', apply);
    reduced.addEventListener('change', apply);
    return () => {
      fine.removeEventListener('change', apply);
      reduced.removeEventListener('change', apply);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const dot = dotRef.current;
    gsap.set(dot, { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const setX = gsap.quickSetter(dot, 'x', 'px');
    const setY = gsap.quickSetter(dot, 'y', 'px');
    let points = [];

    const onMove = (e) => {
      setX(e.clientX);
      setY(e.clientY);
      if (withTrail) points.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    };
    const onOver = (e) => {
      const hover = isInteractive(e.target);
      dot.dataset.hover = String(hover);
      gsap.to(dot, { scale: hover ? 2.4 : 1, duration: 0.3, ease: 'power2.out', overwrite: true });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver);

    const cleanups = [
      () => window.removeEventListener('pointermove', onMove),
      () => window.removeEventListener('pointerover', onOver),
    ];

    const canvas = canvasRef.current;
    if (withTrail && canvas) {
      const ctx = canvas.getContext('2d');
      let ink = readInk();

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);

      // A cor da tinta acompanha o tema
      const observer = new MutationObserver(() => {
        ink = readInk();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      const draw = () => {
        points = pruneTrail(points, performance.now());
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (points.length < 2) return;
        ctx.strokeStyle = ink;
        ctx.lineCap = 'round';
        for (let i = 1; i < points.length; i++) {
          ctx.lineWidth = trailWidth(i, points.length, TRAIL_MAX_WIDTH);
          ctx.globalAlpha = 0.25 + 0.5 * (i / (points.length - 1));
          ctx.beginPath();
          ctx.moveTo(points[i - 1].x, points[i - 1].y);
          ctx.lineTo(points[i].x, points[i].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      gsap.ticker.add(draw);

      cleanups.push(
        () => gsap.ticker.remove(draw),
        () => window.removeEventListener('resize', resize),
        () => observer.disconnect(),
      );
    }

    return () => cleanups.forEach((fn) => fn());
  }, [enabled, withTrail]);

  if (!enabled) return null;

  return (
    <>
      {withTrail ? (
        <canvas
          ref={canvasRef}
          data-cursor-trail=""
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }}
        />
      ) : null}
      <div
        ref={dotRef}
        data-cursor="ink"
        data-hover="false"
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, left: 0, width: DOT_SIZE, height: DOT_SIZE,
          borderRadius: '50%', background: 'var(--ink)', pointerEvents: 'none', zIndex: 9999,
        }}
      />
    </>
  );
}
```

- [ ] **Step 7: Trocar o cursor em `src/app/layout.js`**

Trocar:

```js
import CustomCursor from '../components/CustomCursor';
```

por:

```js
import InkCursor from '../components/InkCursor';
```

E trocar `<CustomCursor />` por `<InkCursor />`.

- [ ] **Step 8: Apagar o cursor antigo**

```bash
git rm src/components/CustomCursor.js
```

- [ ] **Step 9: Rodar os testes**

Run: `npx playwright test tests/e2e/cursor.spec.js`
Expected: `3 passed`

Run: `npm test && npm run test:e2e`
Expected: tudo passa

Conferir: `grep -rn "CustomCursor\|LoadingScreen" src` não deve retornar nada.

- [ ] **Step 10: Commit**

```bash
git add src/lib/cursor src/components/InkCursor.js tests/unit/trail.test.js tests/e2e/cursor.spec.js src/app/layout.js
git commit -m "Feat: Adiciona cursor de tinta com rastro de pincel" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Verificação final da fase

**Files:** nenhum arquivo novo. Ajustes de valores em `src/components/scene/config.js` ou em `SCENE_ACCENTS` só se a checagem visual pedir.

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: `✓ Compiled successfully`, sem erros

- [ ] **Step 2: Suíte completa**

Run: `npm test && npm run test:e2e`
Expected: tudo passa

- [ ] **Step 3: Checagem visual no navegador (`npm run dev`)**

Em `http://localhost:3000`, conferir:
1. **Loader:** o ensō se desenha, fecha e dissolve, e o hero entra por baixo.
2. **Nome:** vai de latim para katakana e depois para kanji, com o scramble em kana, e volta ao latim.
3. **Pétalas:** caem com vento no topo da home, fogem do cursor e somem ao rolar para o verão.
4. **Torii:** a câmera passa por baixo do nuki, sem atravessar a madeira.
5. **昼/夜:** o sol pálido vira lua, o torii escurece, o ícone gira, e o fundo e o texto fazem crossfade em cerca de 0,8s.
6. **Cursor:** ponto de tinta com rastro fino, crescendo sobre links, e a cor segue o tema.
7. **Movimento reduzido** (DevTools → Rendering): o loader é rápido, o nome fica fixo no latim, as pétalas ficam paradas e o cursor não tem rastro.

Se a câmera cortar o torii (item 4), ajustar em `config.js` apenas `TORII.nukiY` e `TORII.kasagiY` (subir os dois juntos) e `TORII.pillarHeight`. Depois rodar de novo `npm run test:e2e`.

- [ ] **Step 4: Commit dos ajustes (se houver)**

```bash
git add src/components/scene/config.js src/lib/palette.js
git commit -m "Style: Ajusta proporções do torii e acentos da cena" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Cobertura da spec (fase 2)

| Requisito da spec | Task |
|-------------------|------|
| §4.0 ensō com DrawSVG, dissolve e revela a cena; sem WebGL completa | 2 |
| §4.1 camadas + névoa (fase 1), torii em primeiro plano, sakura instanciada com vento em shader, fuga do cursor (`uPointer`) | 4, 5 |
| §4.1 nome com ScrambleText em ciclo (latim → katakana → kanji); cargos e indicador de scroll | 3 |
| §4.1 câmera atravessa o torii no primeiro trecho do scroll | 5 |
| §4.10 transição 昼/夜 (crossfade + troca de tokens), lua/sol | 1, 5 |
| §4.10 InkCursor: ponto de tinta com rastro, cresce sobre links, só `(pointer: fine)` | 6 |
| §6 reduced motion: nome final direto, loader sem espera, sem rastro | 2, 3, 4, 6 |
| §9 fontes com kanji sem peso extra | 2, 3 (pilha do sistema) |
| Minor adiado da fase 1: flash de tema no reload | 1 |

Itens deliberadamente fora da fase 2:
- Bloom das lanternas: fase 5, junto com as lanternas.
- Teste E2E do caminho do error boundary: segue adiado.
- Ajuste fino das silhuetas noturnas: segue adiado; a lua ajuda a leitura do céu.
- `assetsProgress`: não entra no loader porque não há assets carregados por loader (tudo é procedural). Fica disponível para quando entrarem texturas ou GLTF.
