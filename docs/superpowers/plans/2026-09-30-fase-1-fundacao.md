# Fase 1 — Fundação do redesign imersivo: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar de pé a base técnica do redesign. Isso inclui o canvas 3D persistente com montanhas em névoa, a câmera guiada pelo scroll, a mistura das quatro estações, os temas 昼/夜, o sistema de qualidade, o fallback sem WebGL e a infraestrutura de testes. O conteúdo atual da home continua funcionando por cima.

**Architecture:**
- Um `<Canvas>` do React Three Fiber fica fixo atrás do DOM, montado uma vez no `layout.js`.
- Uma store zustand (`journeyStore`) recebe o progresso do scroll (Lenis + ScrollTrigger), a seção ativa, o tema, a qualidade e a rota.
- As cenas leem a store dentro de `useFrame`, sem re-render do React.
- A lógica pura (estações, qualidade, relevo das montanhas, paleta) fica em `src/lib/` e tem testes unitários.
- O comportamento integrado é testado com Playwright.

**Tech Stack:** Next.js 16 (App Router, JS), React 19.2, three, @react-three/fiber 9, @react-three/drei 10, zustand 5, lenis 1.3, detect-gpu, GSAP 3.15 (já instalado), Vitest 3, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-30-immersive-japanese-redesign-design.md` (seções 3, 4.10, 5, 6, 7 e fase 1 da seção 8)

## Global Constraints

- Tudo em JavaScript (sem TypeScript), seguindo o padrão do repo: `'use client'` no topo de componentes cliente e imports relativos.
- GSAP só via `src/lib/gsap.js`; não importar de `'gsap'` direto em componentes.
- Componentes 3D leem a store com `journeyStore.getState()` dentro de `useFrame`; nunca usar o seletor React (`useJourney`) para valores que mudam por frame.
- Canvas com `aria-hidden="true"`; todo conteúdo continua no DOM.
- Store `theme`: `'day' | 'night'` (padrão `'night'`). Store `quality`: `null` até a detecção e depois `'high' | 'low'`; nunca volta de `'low'` para `'high'` na mesma sessão.
- `high`: dpr `[1, 1.5]`; `low`: dpr `1`. Rebaixar se FPS < 45 por ~2s.
- `high` só se `(pointer: fine)` e largura ≥ 1024 e tier da GPU ≥ 2. Se a detecção de GPU falhar, decidir só por ponteiro e largura.
- Rotas fora de `/` usam `route: 'frozen'`, com progresso fixo `FROZEN_PROGRESS = 0.7` (outono) e `frameloop="demand"`.
- Orçamento da cena inicial: < 1,5 MB. A fase 1 não usa texturas nem GLTF (geometria procedural).
- `@react-three/postprocessing` **não** entra nesta fase (bloom chega na fase 2 com as lanternas).
- Mensagens de commit no padrão do repo (`Feat:`, `Refactor:`, `Test:`, `Style:`, `Chore:` + descrição em português), terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `vitest.config.mjs` | Config dos testes unitários |
| `playwright.config.mjs` | Config dos testes E2E (build + start na porta 3100) |
| `tests/e2e/helpers.js` | Coleta de erros de console |
| `tests/e2e/smoke.spec.js` | Rotas carregam sem erro |
| `tests/e2e/theme.spec.js` | Toggle 昼/夜 e persistência |
| `tests/e2e/journey.spec.js` | Seções, estações, Lenis, reduced motion |
| `tests/e2e/scene.spec.js` | Canvas WebGL e fallback |
| `tests/unit/*.test.js` | Testes da lógica pura |
| `src/lib/palette.js` | Tokens dos temas e cores das estações (fonte JS) |
| `src/lib/journey/season.js` | Progresso → estação, interpolação de cores |
| `src/lib/journey/quality.js` | Decisão de qualidade e parâmetros por nível |
| `src/lib/journey/ridge.js` | Gerador determinístico de relevo de montanha |
| `src/lib/webgl.js` | Detecção de suporte a WebGL |
| `src/store/journey.js` | Store `journeyStore` + hook `useJourney` |
| `src/hooks/useQuality.js` | Detecta a qualidade na carga |
| `src/components/journey/JourneySync.js` | Sincroniza rota, tema, reduced motion e atributos `data-*` do `<html>` |
| `src/components/journey/SmoothScroll.js` | Lenis + ScrollTrigger → `progress` |
| `src/components/journey/Section.js` | Seção do DOM que informa seção ativa/progresso |
| `src/components/scene/config.js` | Caminho da câmera e camadas de montanha |
| `src/components/scene/SceneCanvas.js` | Wrapper fixo: escolhe canvas 3D ou fallback |
| `src/components/scene/Canvas3D.js` | `<Canvas>` do R3F, dpr, frameloop, PerformanceMonitor |
| `src/components/scene/World.js` | Compõe a cena e invalida no modo demand |
| `src/components/scene/Atmosphere.js` | Céu e névoa por estação/tema |
| `src/components/scene/JourneyCamera.js` | Câmera na curva pelo progresso |
| `src/components/scene/MountainLayers.js` | Camadas de montanha procedurais |
| `src/components/scene/StaticBackdrop.js` | Fundo SVG estático (sem WebGL) |

Arquivos modificados: `package.json`, `.gitignore`, `src/app/globals.css`, `src/context/SettingsContext.js`, `src/components/Navbar.js`, `src/app/layout.js`, `src/app/page.js`, `src/components/ExperienceSection.js`, `src/app/not-found.js`, `src/app/projects/page.js`, `src/app/projects/[slug]/page.js`, `src/app/contact/page.js`.

Arquivos removidos: `src/components/Particles.js` e `src/components/BackgroundParticles.js`.

---

### Task 1: Infraestrutura de testes (Vitest + Playwright + smoke)

**Files:**
- Create: `vitest.config.mjs`, `playwright.config.mjs`, `tests/e2e/helpers.js`, `tests/e2e/smoke.spec.js`
- Modify: `package.json` (scripts), `.gitignore`

**Interfaces:**
- Produces:
  - `npm test` roda o Vitest.
  - `npm run test:e2e` roda o Playwright.
  - `collectConsoleErrors(page, { ignore?: RegExp[] }) => string[]`, em `tests/e2e/helpers.js`.

- [ ] **Step 1: Instalar as ferramentas**

```bash
npm install -D vitest@^3 @playwright/test@^1.55
npx playwright install chromium
```

- [ ] **Step 2: Criar `vitest.config.mjs`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
    passWithNoTests: true,
  },
});
```

- [ ] **Step 3: Criar `playwright.config.mjs`**

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  use: { baseURL: 'http://localhost:3100' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run start -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
```

- [ ] **Step 4: Adicionar os scripts no `package.json`**

Em `"scripts"`, depois de `"start": "next start"`:

```json
    "start": "next start",
    "test": "vitest run",
    "test:e2e": "playwright test"
```

- [ ] **Step 5: Ignorar os artefatos de teste no `.gitignore`**

Depois do bloco `# testing` / `/coverage`:

```
# testing
/coverage
/test-results/
/playwright-report/
```

- [ ] **Step 6: Criar `tests/e2e/helpers.js`**

```js
// Erros que não vêm do nosso código: script do Vercel Analytics fora da Vercel
const DEFAULT_IGNORE = [/_vercel\/insights/, /Vercel Web Analytics/];

export function collectConsoleErrors(page, { ignore = [] } = {}) {
  const errors = [];
  const patterns = [...DEFAULT_IGNORE, ...ignore];
  const keep = (text) => !patterns.some((p) => p.test(text));
  page.on('console', (msg) => {
    // Erros de recurso ("Failed to load resource") só trazem a URL em location()
    const text = `${msg.text()} ${msg.location()?.url ?? ''}`;
    if (msg.type() === 'error' && keep(text)) errors.push(text);
  });
  page.on('pageerror', (err) => {
    if (keep(err.message)) errors.push(err.message);
  });
  return errors;
}
```

- [ ] **Step 7: Escrever o smoke test `tests/e2e/smoke.spec.js`**

```js
import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

test('home carrega com o nome no hero', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  await expect(page.locator('.hero-title')).toContainText('Raphael Nobuyuki Haga Okuyama', { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('detalhe do projeto IMACARDIOS carrega', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/projects/imacardios');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('IMACARDIOS');
  expect(errors).toEqual([]);
});

test('certificados carregam', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/certificates');
  await expect(page.locator('.responsive-title')).toBeVisible();
  expect(errors).toEqual([]);
});

test('rota inexistente mostra o 404', async ({ page }) => {
  // O próprio documento responde 404; o navegador loga isso como erro de recurso
  const errors = collectConsoleErrors(page, { ignore: [/status of 404/] });
  await page.goto('/rota-que-nao-existe');
  await expect(page.getByText('Página não encontrada')).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 8: Rodar os testes. Devem passar no site atual (baseline)**

Run: `npm test`
Expected: `No test files found, exiting with code 0`

Run: `npm run test:e2e`
Expected: `4 passed`

Se algum teste falhar por erro de console real no site atual, **pare e reporte o erro**. Não mascare com `ignore`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore vitest.config.mjs playwright.config.mjs tests/e2e
git commit -m "Test: Adiciona Vitest, Playwright e smoke das rotas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Paleta e temas 昼/夜

**Files:**
- Create: `src/lib/palette.js`, `tests/unit/palette.test.js`, `tests/e2e/theme.spec.js`
- Modify:
  - `src/app/globals.css` (linhas 1–17: tokens; e a regra `.btn-fill:hover` e `.glow-btn:hover`)
  - `src/context/SettingsContext.js`
  - `src/components/Navbar.js` (linhas 62 e 109)
  - `src/app/not-found.js:107`, `src/app/projects/page.js:44`, `src/app/projects/[slug]/page.js:65`
  - `src/app/contact/page.js` (cor do botão de envio)

**Interfaces:**
- Produces, em `src/lib/palette.js`:
  - `THEMES`: `{ night: Tokens, day: Tokens }`, onde `Tokens = { bgColor, textPrimary, textSecondary, accent, onAccent, border, cardBg, ink, paper }` (strings hex `#rrggbb`).
  - `SEASONS`: `{ night: Season[4], day: Season[4] }`, onde `Season = { sky: string, fog: string, mountains: [near, mid, far] }`, na ordem primavera, verão, outono, inverno.
  - `normalizeTheme(value: string | null) => 'day' | 'night'`.
  - `THEME_NAMES = ['night', 'day']`.
- Produces, em `SettingsContext`: `theme` passa a valer `'night' | 'day'`, e o `<html data-theme>` usa os mesmos valores.

- [ ] **Step 1: Escrever o teste unitário `tests/unit/palette.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { THEMES, SEASONS, normalizeTheme } from '../../src/lib/palette';

const HEX = /^#[0-9a-f]{6}$/;
const css = readFileSync(new URL('../../src/app/globals.css', import.meta.url), 'utf8');

// Lê as variáveis CSS do primeiro bloco cujo seletor contém `selector`
function cssVars(selector) {
  const start = css.indexOf(selector);
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const kebab = (key) => key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

describe('THEMES', () => {
  it('os dois temas têm as mesmas chaves, todas em hex', () => {
    expect(Object.keys(THEMES.day).sort()).toEqual(Object.keys(THEMES.night).sort());
    for (const tokens of Object.values(THEMES)) {
      for (const value of Object.values(tokens)) expect(value).toMatch(HEX);
    }
  });

  it.each([
    ['night', "[data-theme='night']"],
    ['day', "[data-theme='day']"],
  ])('globals.css espelha THEMES.%s', (name, selector) => {
    const vars = cssVars(selector);
    for (const [key, value] of Object.entries(THEMES[name])) {
      expect(vars[kebab(key)], `--${kebab(key)}`).toBe(value);
    }
  });
});

describe('SEASONS', () => {
  it('cada tema tem 4 estações com céu, névoa e 3 tons de montanha', () => {
    for (const seasons of Object.values(SEASONS)) {
      expect(seasons).toHaveLength(4);
      for (const s of seasons) {
        expect(s.sky).toMatch(HEX);
        expect(s.fog).toMatch(HEX);
        expect(s.mountains).toHaveLength(3);
        s.mountains.forEach((c) => expect(c).toMatch(HEX));
      }
    }
  });
});

describe('normalizeTheme', () => {
  it.each([
    ['day', 'day'],
    ['light', 'day'],
    ['night', 'night'],
    ['dark', 'night'],
    [null, 'night'],
    ['qualquer', 'night'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeTheme(input)).toBe(expected);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- tests/unit/palette.test.js`
Expected: FAIL com `Failed to resolve import "../../src/lib/palette"`

- [ ] **Step 3: Criar `src/lib/palette.js`**

```js
// Fonte única das cores. globals.css espelha THEMES (testado em tests/unit/palette.test.js).

export const THEME_NAMES = ['night', 'day'];

// 夜 noite: índigo (藍) com acento dourado · 昼 dia: papel washi com acento shu (朱)
export const THEMES = {
  night: {
    bgColor: '#0f1626',
    textPrimary: '#e8e4da',
    textSecondary: '#a7adbd',
    accent: '#d9a441',
    onAccent: '#1b1405',
    border: '#2a3450',
    cardBg: '#161f33',
    ink: '#e8e4da',
    paper: '#1b2438',
  },
  day: {
    bgColor: '#f3eee3',
    textPrimary: '#1f1d1a',
    textSecondary: '#5b564d',
    accent: '#c23b30',
    onAccent: '#ffffff',
    border: '#ddd5c4',
    cardBg: '#ebe4d5',
    ink: '#1f1d1a',
    paper: '#fbf8f1',
  },
};

// Cores da cena por estação: primavera, verão, outono, inverno.
// mountains = [perto, meio, longe]
export const SEASONS = {
  night: [
    { sky: '#1c1f3a', fog: '#2b2c4d', mountains: ['#0f1124', '#1f2140', '#34365c'] },
    { sky: '#0f2226', fog: '#1a3336', mountains: ['#08161a', '#12272b', '#21393d'] },
    { sky: '#241826', fog: '#352434', mountains: ['#150d16', '#281a28', '#3f2b3d'] },
    { sky: '#161d2b', fog: '#26303f', mountains: ['#0b1019', '#1a2230', '#2f3a4b'] },
  ],
  day: [
    { sky: '#f6e7e4', fog: '#f1dcdc', mountains: ['#6b6f86', '#9a9cb3', '#c8c6d6'] },
    { sky: '#e3efe6', fog: '#d6e6dc', mountains: ['#2f5a4a', '#5f8a76', '#a3c2b0'] },
    { sky: '#f4e3cf', fog: '#ecd3b8', mountains: ['#7a3b2a', '#a8674a', '#d3a684'] },
    { sky: '#eef1f4', fog: '#e2e7ec', mountains: ['#4a5563', '#7f8a98', '#b9c2cc'] },
  ],
};

// Aceita valores antigos salvos no localStorage ('dark'/'light')
export function normalizeTheme(value) {
  return value === 'day' || value === 'light' ? 'day' : 'night';
}
```

- [ ] **Step 4: Substituir os tokens no topo de `src/app/globals.css` (linhas 1–17)**

Trocar os blocos `:root { ... }` e `[data-theme='light'] { ... }` por:

```css
:root, [data-theme='night'] {
  --bg-color: #0f1626;
  --text-primary: #e8e4da;
  --text-secondary: #a7adbd;
  --accent: #d9a441;
  --on-accent: #1b1405;
  --border: #2a3450;
  --card-bg: #161f33;
  --ink: #e8e4da;
  --paper: #1b2438;
}

[data-theme='day'] {
  --bg-color: #f3eee3;
  --text-primary: #1f1d1a;
  --text-secondary: #5b564d;
  --accent: #c23b30;
  --on-accent: #ffffff;
  --border: #ddd5c4;
  --card-bg: #ebe4d5;
  --ink: #1f1d1a;
  --paper: #fbf8f1;
}
```

No bloco de microinterações do mesmo arquivo, trocar:

```css
.btn-fill:hover { scale: 1.05; background-color: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; }
```

por:

```css
.btn-fill:hover { scale: 1.05; background-color: var(--accent) !important; color: var(--on-accent) !important; border-color: var(--accent) !important; }
```

e trocar:

```css
.glow-btn:hover { scale: 1.05; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
```

por:

```css
.glow-btn:hover { scale: 1.05; box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 40%, transparent); }
```

- [ ] **Step 5: Rodar o teste unitário**

Run: `npm test -- tests/unit/palette.test.js`
Expected: PASS (todos os testes)

- [ ] **Step 6: Remover o azul hardcoded dos componentes**

Em `src/app/not-found.js`, `src/app/projects/page.js` e `src/app/projects/[slug]/page.js`, trocar cada ocorrência de:

```js
'rgba(59, 130, 246, 0.1)'
```

por:

```js
'color-mix(in srgb, var(--accent) 12%, transparent)'
```

Em `src/app/contact/page.js`, no estilo do botão de envio, trocar `background: 'var(--accent)', color: '#fff',` por:

```js
background: 'var(--accent)', color: 'var(--on-accent)',
```

Conferir: `grep -rn "59, 130, 246" src` não deve retornar nada.

- [ ] **Step 7: Escrever o teste E2E `tests/e2e/theme.spec.js`**

```js
import { test, expect } from '@playwright/test';

test('tema padrão é noite e o toggle alterna para dia, persistindo', async ({ page }) => {
  await page.goto('/certificates');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'night');

  await page.getByRole('button', { name: 'Alternar dia/noite' }).first().click();
  await expect(html).toHaveAttribute('data-theme', 'day');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'day');
});

test('valor antigo "light" no localStorage vira dia', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto('/certificates');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
});
```

- [ ] **Step 8: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/theme.spec.js`
Expected: FAIL. O `data-theme` atual é `dark` e não existe botão com o nome `Alternar dia/noite`.

- [ ] **Step 9: Atualizar `src/context/SettingsContext.js`**

Arquivo completo:

```js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { resumeData } from '../data/resume';
import { normalizeTheme } from '../lib/palette';

const SettingsContext = createContext();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Storage bloqueado (aba privada etc.): o tema só não persiste
  }
}

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState('pt');
  const [theme, setTheme] = useState('night');

  // Alternar 昼/夜
  const toggleTheme = () => {
    const next = theme === 'night' ? 'day' : 'night';
    setTheme(next);
    applyTheme(next);
  };

  // Alternar Idioma
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'pt' ? 'en' : 'pt'));
  };

  // Carregar preferência salva (aceita valores antigos 'dark'/'light')
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem('theme');
    } catch {
      saved = null;
    }
    const initial = normalizeTheme(saved);
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Dados atuais baseados no idioma
  const currentData = resumeData[language];

  return (
    <SettingsContext.Provider value={{ language, toggleLanguage, theme, toggleTheme, currentData }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
```

- [ ] **Step 10: Atualizar os botões de tema em `src/components/Navbar.js`**

Linha 62 (desktop), trocar:

```jsx
              <button onClick={toggleTheme} style={btnStyle}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
```

por:

```jsx
              <button onClick={toggleTheme} style={btnStyle} aria-label={themeLabel}>{theme === 'night' ? <Sun size={20} /> : <Moon size={20} />}</button>
```

Linha 109 (mobile), trocar:

```jsx
              <button onClick={toggleTheme} style={{...btnStyle, transform: 'scale(1.2)'}}>{theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}</button>
```

por:

```jsx
              <button onClick={toggleTheme} style={{...btnStyle, transform: 'scale(1.2)'}} aria-label={themeLabel}>{theme === 'night' ? <Sun size={24} /> : <Moon size={24} />}</button>
```

E, logo depois da linha `const toggleMenu = ...` / bloco do menu (antes do `return`), adicionar:

```js
  const themeLabel = language === 'pt' ? 'Alternar dia/noite' : 'Toggle day/night';
```

O teste usa o rótulo em PT, que é o idioma padrão.

- [ ] **Step 11: Rodar os testes**

Run: `npx playwright test tests/e2e/theme.spec.js`
Expected: `2 passed`

Run: `npm test`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add src/lib/palette.js tests/unit/palette.test.js tests/e2e/theme.spec.js src/app/globals.css src/context/SettingsContext.js src/components/Navbar.js src/app/not-found.js src/app/projects/page.js "src/app/projects/[slug]/page.js" src/app/contact/page.js
git commit -m "Feat: Adiciona paleta japonesa e temas dia/noite" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Lógica pura de estações e qualidade

**Files:**
- Create: `src/lib/journey/season.js`, `src/lib/journey/quality.js`, `tests/unit/season.test.js`, `tests/unit/quality.test.js`

**Interfaces:**
- Consumes: `SEASONS` de `src/lib/palette.js` (só nos testes).
- Produces, em `season.js`:
  - `SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter']`
  - `FROZEN_PROGRESS = 0.7`
  - `clamp01(v: number) => number`
  - `seasonMixFromProgress(progress: number) => number` (0–3)
  - `seasonNameFromMix(mix: number) => string`
  - `lerpHex(a: string, b: string, t: number) => string`
  - `sampleSeason(seasons: Season[], mix: number) => Season`
- Produces, em `quality.js`:
  - `decideQuality({ pointerFine: boolean, width: number, gpuTier: number | null }) => 'high' | 'low'`
  - `QUALITY_SETTINGS = { high: { dpr: [1, 1.5], particles: 1500, postprocessing: true, sandDisplacement: true }, low: { dpr: 1, particles: 300, postprocessing: false, sandDisplacement: false } }`

- [ ] **Step 1: Escrever `tests/unit/season.test.js`**

```js
import { describe, it, expect } from 'vitest';
import {
  clamp01, seasonMixFromProgress, seasonNameFromMix, lerpHex, sampleSeason, FROZEN_PROGRESS,
} from '../../src/lib/journey/season';
import { SEASONS } from '../../src/lib/palette';

describe('clamp01', () => {
  it.each([[-1, 0], [0.4, 0.4], [2, 1]])('%s → %s', (v, e) => expect(clamp01(v)).toBe(e));
});

describe('seasonMixFromProgress', () => {
  it('mapeia 0–1 em 0–3 e limita fora da faixa', () => {
    expect(seasonMixFromProgress(0)).toBe(0);
    expect(seasonMixFromProgress(0.5)).toBe(1.5);
    expect(seasonMixFromProgress(1)).toBe(3);
    expect(seasonMixFromProgress(-0.2)).toBe(0);
    expect(seasonMixFromProgress(1.3)).toBe(3);
  });

  it('progresso congelado cai no outono', () => {
    expect(seasonNameFromMix(seasonMixFromProgress(FROZEN_PROGRESS))).toBe('autumn');
  });
});

describe('seasonNameFromMix', () => {
  it.each([[0, 'spring'], [0.6, 'summer'], [1.4, 'summer'], [2.2, 'autumn'], [3, 'winter']])(
    '%s → %s', (mix, name) => expect(seasonNameFromMix(mix)).toBe(name),
  );
});

describe('lerpHex', () => {
  it('interpola canal a canal e arredonda', () => {
    expect(lerpHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(lerpHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(lerpHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(lerpHex('#ff0000', '#0000ff', 0.25)).toBe('#bf0040');
  });
});

describe('sampleSeason', () => {
  const seasons = SEASONS.night;

  it('mix inteiro devolve a estação exata', () => {
    expect(sampleSeason(seasons, 0)).toEqual(seasons[0]);
    expect(sampleSeason(seasons, 2)).toEqual(seasons[2]);
    expect(sampleSeason(seasons, 3)).toEqual(seasons[3]);
  });

  it('mix fracionário interpola entre estações vizinhas', () => {
    const mid = sampleSeason(seasons, 0.5);
    expect(mid.sky).toBe(lerpHex(seasons[0].sky, seasons[1].sky, 0.5));
    expect(mid.mountains[2]).toBe(lerpHex(seasons[0].mountains[2], seasons[1].mountains[2], 0.5));
  });

  it('limita mix fora da faixa', () => {
    expect(sampleSeason(seasons, -1)).toEqual(seasons[0]);
    expect(sampleSeason(seasons, 9)).toEqual(seasons[3]);
  });
});
```

- [ ] **Step 2: Escrever `tests/unit/quality.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { decideQuality, QUALITY_SETTINGS } from '../../src/lib/journey/quality';

describe('decideQuality', () => {
  it.each([
    [{ pointerFine: true, width: 1440, gpuTier: 3 }, 'high'],
    [{ pointerFine: true, width: 1024, gpuTier: 2 }, 'high'],
    [{ pointerFine: true, width: 1440, gpuTier: 1 }, 'low'],
    [{ pointerFine: true, width: 1023, gpuTier: 3 }, 'low'],
    [{ pointerFine: false, width: 1440, gpuTier: 3 }, 'low'],
    // Detecção de GPU falhou: decide só por ponteiro e largura
    [{ pointerFine: true, width: 1440, gpuTier: null }, 'high'],
    [{ pointerFine: false, width: 400, gpuTier: null }, 'low'],
  ])('%o → %s', (input, expected) => expect(decideQuality(input)).toBe(expected));
});

describe('QUALITY_SETTINGS', () => {
  it('segue a tabela da spec', () => {
    expect(QUALITY_SETTINGS.high).toEqual({ dpr: [1, 1.5], particles: 1500, postprocessing: true, sandDisplacement: true });
    expect(QUALITY_SETTINGS.low).toEqual({ dpr: 1, particles: 300, postprocessing: false, sandDisplacement: false });
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL com `Failed to resolve import "../../src/lib/journey/season"` e `.../quality`

- [ ] **Step 4: Criar `src/lib/journey/season.js`**

```js
// Progresso do scroll → estação (四季) e interpolação de cores da cena

export const SEASON_NAMES = ['spring', 'summer', 'autumn', 'winter'];

// Ponto fixo da montanha nas rotas fora da jornada (outono)
export const FROZEN_PROGRESS = 0.7;

export function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function seasonMixFromProgress(progress) {
  return clamp01(progress) * (SEASON_NAMES.length - 1);
}

export function seasonNameFromMix(mix) {
  const index = Math.round(Math.min(Math.max(mix, 0), SEASON_NAMES.length - 1));
  return SEASON_NAMES[index];
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

export function lerpHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((c, i) => Math.round(c + (cb[i] - c) * t)));
}

export function sampleSeason(seasons, mix) {
  const m = Math.min(Math.max(mix, 0), seasons.length - 1);
  const i = Math.min(Math.floor(m), seasons.length - 2);
  const t = m - i;
  const a = seasons[i];
  const b = seasons[i + 1];
  if (t === 0) return a;
  if (t === 1) return b;
  return {
    sky: lerpHex(a.sky, b.sky, t),
    fog: lerpHex(a.fog, b.fog, t),
    mountains: a.mountains.map((c, k) => lerpHex(c, b.mountains[k], t)),
  };
}
```

- [ ] **Step 5: Criar `src/lib/journey/quality.js`**

```js
// Nível de qualidade da cena 3D (spec §5)

export const QUALITY_SETTINGS = {
  high: { dpr: [1, 1.5], particles: 1500, postprocessing: true, sandDisplacement: true },
  low: { dpr: 1, particles: 300, postprocessing: false, sandDisplacement: false },
};

// gpuTier null = detecção falhou; aí decide só por ponteiro e largura
// (o PerformanceMonitor rebaixa depois se o FPS cair)
export function decideQuality({ pointerFine, width, gpuTier }) {
  if (!pointerFine || width < 1024) return 'low';
  if (gpuTier !== null && gpuTier < 2) return 'low';
  return 'high';
}
```

- [ ] **Step 6: Rodar os testes**

Run: `npm test`
Expected: PASS em todos os arquivos (`palette`, `season`, `quality`)

- [ ] **Step 7: Commit**

```bash
git add src/lib/journey tests/unit/season.test.js tests/unit/quality.test.js
git commit -m "Feat: Adiciona lógica de estações e níveis de qualidade" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Store `journeyStore`

**Files:**
- Create: `src/store/journey.js`, `tests/unit/journey-store.test.js`
- Modify: `package.json` (dependência `zustand`)

**Interfaces:**
- Consumes: `clamp01`, `seasonMixFromProgress`, `FROZEN_PROGRESS` de `src/lib/journey/season.js`.
- Produces, em `src/store/journey.js`:
  - `createJourneyStore() => StoreApi`, uma fábrica usada nos testes.
  - `journeyStore`, a instância única do app, com `getState()`, `setState()` e `subscribe()`.
  - `useJourney(selector)`, o hook React (`useStore(journeyStore, selector)`).
  - `effectiveProgress(state) => number`: `FROZEN_PROGRESS` se `route === 'frozen'`, senão `progress`.
  - Estado: `{ progress, section, sectionProgress, seasonMix, theme, quality, reducedMotion, route, assetsProgress }`.
  - Ações: `setProgress(p)`, `setSection(id, p)`, `setTheme(t)`, `setInitialQuality(q)`, `downgradeQuality()`, `setReducedMotion(b)`, `setRoute(r)`, `setAssetsProgress(n)`.

- [ ] **Step 1: Instalar o zustand**

```bash
npm install zustand@^5
```

- [ ] **Step 2: Escrever `tests/unit/journey-store.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createJourneyStore, effectiveProgress } from '../../src/store/journey';
import { FROZEN_PROGRESS, seasonMixFromProgress } from '../../src/lib/journey/season';

let store;
beforeEach(() => {
  store = createJourneyStore();
});

describe('estado inicial', () => {
  it('começa no hero, noite, qualidade indefinida', () => {
    const s = store.getState();
    expect(s).toMatchObject({
      progress: 0, section: 'hero', sectionProgress: 0, seasonMix: 0,
      theme: 'night', quality: null, reducedMotion: false, route: 'journey', assetsProgress: 0,
    });
  });
});

describe('setProgress', () => {
  it('limita a 0–1 e deriva seasonMix', () => {
    store.getState().setProgress(0.5);
    expect(store.getState().progress).toBe(0.5);
    expect(store.getState().seasonMix).toBe(1.5);
    store.getState().setProgress(4);
    expect(store.getState().progress).toBe(1);
    expect(store.getState().seasonMix).toBe(3);
  });

  it('em rota congelada guarda o progresso mas a estação fica no ponto fixo', () => {
    store.getState().setRoute('frozen');
    store.getState().setProgress(0.1);
    expect(store.getState().progress).toBe(0.1);
    expect(store.getState().seasonMix).toBe(seasonMixFromProgress(FROZEN_PROGRESS));
  });
});

describe('setRoute', () => {
  it('recalcula seasonMix ao entrar e sair da rota congelada', () => {
    store.getState().setProgress(0.2);
    store.getState().setRoute('frozen');
    expect(store.getState().seasonMix).toBe(seasonMixFromProgress(FROZEN_PROGRESS));
    store.getState().setRoute('journey');
    expect(store.getState().seasonMix).toBeCloseTo(0.6);
  });
});

describe('effectiveProgress', () => {
  it('usa o progresso real na jornada e o ponto fixo fora dela', () => {
    store.getState().setProgress(0.3);
    expect(effectiveProgress(store.getState())).toBe(0.3);
    store.getState().setRoute('frozen');
    expect(effectiveProgress(store.getState())).toBe(FROZEN_PROGRESS);
  });
});

describe('setSection', () => {
  it('define seção e progresso limitado', () => {
    store.getState().setSection('about', 1.7);
    expect(store.getState()).toMatchObject({ section: 'about', sectionProgress: 1 });
  });
});

describe('qualidade', () => {
  it('setInitialQuality só vale uma vez', () => {
    store.getState().setInitialQuality('high');
    store.getState().setInitialQuality('low');
    expect(store.getState().quality).toBe('high');
  });

  it('downgradeQuality rebaixa para low e não volta', () => {
    store.getState().setInitialQuality('high');
    store.getState().downgradeQuality();
    expect(store.getState().quality).toBe('low');
    store.getState().setInitialQuality('high');
    expect(store.getState().quality).toBe('low');
  });
});

describe('demais setters', () => {
  it('tema, reduced motion e assets', () => {
    store.getState().setTheme('day');
    store.getState().setReducedMotion(true);
    store.getState().setAssetsProgress(150);
    expect(store.getState()).toMatchObject({ theme: 'day', reducedMotion: true, assetsProgress: 100 });
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- tests/unit/journey-store.test.js`
Expected: FAIL com `Failed to resolve import "../../src/store/journey"`

- [ ] **Step 4: Criar `src/store/journey.js`**

```js
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { clamp01, seasonMixFromProgress, FROZEN_PROGRESS } from '../lib/journey/season';

// Progresso que a cena deve usar: o real na jornada, o ponto fixo fora dela
export function effectiveProgress(state) {
  return state.route === 'frozen' ? FROZEN_PROGRESS : state.progress;
}

const mixFor = (progress, route) => seasonMixFromProgress(effectiveProgress({ progress, route }));

export function createJourneyStore() {
  return createStore((set, get) => ({
    progress: 0,
    section: 'hero',
    sectionProgress: 0,
    seasonMix: 0,
    theme: 'night',
    quality: null,
    reducedMotion: false,
    route: 'journey',
    assetsProgress: 0,

    setProgress: (p) => {
      const progress = clamp01(p);
      set({ progress, seasonMix: mixFor(progress, get().route) });
    },
    setSection: (section, p) => set({ section, sectionProgress: clamp01(p) }),
    setTheme: (theme) => set({ theme }),
    // Primeira detecção; depois disso só downgradeQuality muda o valor
    setInitialQuality: (quality) => {
      if (get().quality === null) set({ quality });
    },
    downgradeQuality: () => set({ quality: 'low' }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setRoute: (route) => set({ route, seasonMix: mixFor(get().progress, route) }),
    setAssetsProgress: (n) => set({ assetsProgress: Math.min(100, Math.max(0, n)) }),
  }));
}

// Instância única do app. Cenas 3D: journeyStore.getState() dentro de useFrame.
export const journeyStore = createJourneyStore();

// Componentes React: só para valores que mudam raramente
export function useJourney(selector) {
  return useStore(journeyStore, selector);
}
```

- [ ] **Step 5: Rodar os testes**

Run: `npm test`
Expected: PASS em todos

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/store tests/unit/journey-store.test.js
git commit -m "Feat: Adiciona store da jornada com zustand" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Scroll suave, seções e sincronização

**Files:**
- Create: `src/components/journey/SmoothScroll.js`, `src/components/journey/Section.js`, `src/components/journey/JourneySync.js`, `src/hooks/useQuality.js`, `tests/e2e/journey.spec.js`
- Modify:
  - `package.json` (dependências `lenis` e `detect-gpu`)
  - `src/app/layout.js`
  - `src/app/page.js` (linhas 61, 101, 103, 139, 141, 166)
  - `src/components/ExperienceSection.js` (linhas 37 e 107)

**Interfaces:**
- Consumes: `journeyStore`, `useJourney` (Task 4); `decideQuality` (Task 3); `seasonNameFromMix` (Task 3); `useSettings().theme` (Task 2).
- Produces:
  - `<Section id="hero|about|stack|projects|experience|contact" as? className? style? ref?>`: renderiza `<section id>` e escreve `section`/`sectionProgress` na store.
  - `<SmoothScroll />`: escreve `progress`; adiciona a classe `lenis` ao `<html>` quando ativo.
  - `<JourneySync />`: escreve `route`, `theme`, `reducedMotion` e a qualidade inicial; espelha `data-section` e `data-season` no `<html>`.
  - `useQuality()`: chama `setInitialQuality` uma vez.

- [ ] **Step 1: Escrever o teste E2E `tests/e2e/journey.spec.js`**

```js
import { test, expect } from '@playwright/test';

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('.hero-title')).toBeVisible({ timeout: 15_000 });
}

async function scrollToSection(page, id) {
  await page.evaluate((sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ block: 'center' });
  }, id);
}

test('a seção ativa acompanha o scroll', async ({ page }) => {
  await openHome(page);
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-section', 'hero');
  for (const id of ['about', 'stack', 'experience']) {
    await scrollToSection(page, id);
    await expect(html).toHaveAttribute('data-section', id);
  }
});

test('as estações avançam do topo ao fim da página', async ({ page }) => {
  await openHome(page);
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-season', 'spring');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(html).toHaveAttribute('data-season', 'winter');
});

test('rotas fora da home ficam congeladas no outono', async ({ page }) => {
  await page.goto('/certificates');
  await expect(page.locator('html')).toHaveAttribute('data-season', 'autumn');
});

test('Lenis fica ativo por padrão', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
});

test.describe('com prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Lenis fica desligado e as seções ainda são detectadas', async ({ page }) => {
    await openHome(page);
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/(^|\s)lenis(\s|$)/);
    await scrollToSection(page, 'stack');
    await expect(html).toHaveAttribute('data-section', 'stack');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/journey.spec.js`
Expected: FAIL (`data-section` e `data-season` ausentes, sem classe `lenis`)

- [ ] **Step 3: Instalar as dependências**

```bash
npm install lenis@^1.3 detect-gpu@^5
```

- [ ] **Step 4: Criar `src/components/journey/Section.js`**

```js
'use client';
import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '../../lib/gsap';
import { journeyStore } from '../../store/journey';

// Seção da jornada: informa à store quando está ativa (topo passou do centro da tela)
export default function Section({ id, as: Tag = 'section', ref: externalRef, children, ...rest }) {
  const localRef = useRef(null);

  const setRefs = (node) => {
    localRef.current = node;
    if (typeof externalRef === 'function') externalRef(node);
    else if (externalRef) externalRef.current = node;
  };

  useGSAP(() => {
    const report = (self) => {
      if (self.isActive) journeyStore.getState().setSection(id, self.progress);
    };
    ScrollTrigger.create({
      trigger: localRef.current,
      start: 'top center',
      end: 'bottom center',
      onToggle: report,
      onUpdate: report,
    });
  }, { dependencies: [id] });

  return (
    <Tag id={id} ref={setRefs} {...rest}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 5: Criar `src/components/journey/SmoothScroll.js`**

```js
'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { journeyStore, useJourney } from '../../store/journey';

function nativeProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

// Scroll suave (Lenis) guiado pelo ticker do GSAP; escreve o progresso na store
export default function SmoothScroll() {
  const reducedMotion = useJourney((s) => s.reducedMotion);
  const pathname = usePathname();
  const lenisRef = useRef(null);

  useEffect(() => {
    const { setProgress } = journeyStore.getState();

    if (reducedMotion) {
      const onScroll = () => setProgress(nativeProgress());
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const lenis = new Lenis();
    lenisRef.current = lenis;
    lenis.on('scroll', (instance) => {
      ScrollTrigger.update();
      setProgress(instance.progress);
    });
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setProgress(nativeProgress());

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  // Troca de rota: volta ao topo e recalcula os triggers da página nova
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
```

- [ ] **Step 6: Criar `src/hooks/useQuality.js`**

```js
'use client';
import { useEffect } from 'react';
import { getGPUTier } from 'detect-gpu';
import { decideQuality } from '../lib/journey/quality';
import { journeyStore } from '../store/journey';

const GPU_TIMEOUT_MS = 3000;

// Tier da GPU, ou null se a detecção falhar/demorar (benchmarks vêm de CDN)
async function detectGpuTier() {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), GPU_TIMEOUT_MS));
  const detection = getGPUTier()
    .then((result) => (result.type === 'FALLBACK' ? null : result.tier))
    .catch(() => null);
  return Promise.race([detection, timeout]);
}

export function useQuality() {
  useEffect(() => {
    let cancelled = false;
    const pointerFine = window.matchMedia('(pointer: fine)').matches;
    const width = window.innerWidth;
    detectGpuTier().then((gpuTier) => {
      if (!cancelled) {
        journeyStore.getState().setInitialQuality(decideQuality({ pointerFine, width, gpuTier }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
}
```

- [ ] **Step 7: Criar `src/components/journey/JourneySync.js`**

```js
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettings } from '../../context/SettingsContext';
import { journeyStore, useJourney } from '../../store/journey';
import { seasonNameFromMix } from '../../lib/journey/season';
import { useQuality } from '../../hooks/useQuality';

// Liga o mundo React (rota, tema, preferências) à store e espelha o estado no <html>
export default function JourneySync() {
  const pathname = usePathname();
  const { theme } = useSettings();
  const section = useJourney((s) => s.section);
  const season = useJourney((s) => seasonNameFromMix(s.seasonMix));

  useQuality();

  useEffect(() => {
    journeyStore.getState().setRoute(pathname === '/' ? 'journey' : 'frozen');
  }, [pathname]);

  useEffect(() => {
    journeyStore.getState().setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => journeyStore.getState().setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.section = section;
  }, [section]);

  useEffect(() => {
    document.documentElement.dataset.season = season;
  }, [season]);

  return null;
}
```

- [ ] **Step 8: Montar no `src/app/layout.js`**

Adicionar os imports depois de `import BackgroundParticles ...` (o BackgroundParticles sai na Task 7):

```js
import JourneySync from '../components/journey/JourneySync';
import SmoothScroll from '../components/journey/SmoothScroll';
```

Dentro de `<SettingsProvider>`, antes de `<CustomCursor />`:

```jsx
          <JourneySync />
          <SmoothScroll />
```

- [ ] **Step 9: Usar `<Section>` na home, em `src/app/page.js`**

Adicionar o import depois de `import Reveal from '../components/Reveal';`:

```js
import Section from '../components/journey/Section';
```

Trocar a abertura do hero (linha 61):

```jsx
      <section className="hero-section" ref={heroRef}>
```

por:

```jsx
      <Section id="hero" className="hero-section" ref={heroRef}>
```

e o `</section>` correspondente (linha 101) por `</Section>`.

Trocar (linha 103):

```jsx
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 0 80px 0' }}>
```

por:

```jsx
      <Section id="about" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '0 0 80px 0' }}>
```

e o `</section>` correspondente (linha 139) por `</Section>`.

Trocar (linha 141):

```jsx
      <section style={{ padding: '80px 0' }}>
```

por:

```jsx
      <Section id="stack" style={{ padding: '80px 0' }}>
```

e o `</section>` correspondente (linha 166) por `</Section>`.

- [ ] **Step 10: Usar `<Section>` em `src/components/ExperienceSection.js`**

Adicionar o import depois de `import ScrollReveal from './ScrollReveal';`:

```js
import Section from './journey/Section';
```

Trocar (linha 37):

```jsx
    <section style={{ padding: '100px 0', paddingBottom: '150px' }} ref={refExperience}>
```

por:

```jsx
    <Section id="experience" style={{ padding: '100px 0', paddingBottom: '150px' }} ref={refExperience}>
```

e o `</section>` final (linha 107) por `</Section>`.

- [ ] **Step 11: Rodar os testes**

Run: `npx playwright test tests/e2e/journey.spec.js`
Expected: `5 passed`

Run: `npm run test:e2e`
Expected: todos passam (smoke, theme, journey)

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json src/components/journey src/hooks src/app/layout.js src/app/page.js src/components/ExperienceSection.js tests/e2e/journey.spec.js
git commit -m "Feat: Adiciona scroll suave com Lenis e seções da jornada" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Gerador de relevo das montanhas

**Files:**
- Create: `src/lib/journey/ridge.js`, `tests/unit/ridge.test.js`

**Interfaces:**
- Produces, em `ridge.js`:
  - `mulberry32(seed: number) => () => number`: PRNG determinístico em [0, 1).
  - `ridgePoints({ seed, width, segments, baseHeight, amplitude, valleyCenter = 0, valleyDepth = 0, valleyWidth = 1 }) => Array<[x, y]>`. São `segments + 1` pontos, com x de `-width/2` a `width/2`. Vale y = `baseHeight + h * amplitude * valley(x)`, com h ∈ [0, 1.63] (soma de 3 oitavas de pesos 1, 0.45 e 0.18) e `valley(x) = 1 - valleyDepth * exp(-(x - valleyCenter)² / (2 * valleyWidth²))`.

- [ ] **Step 1: Escrever `tests/unit/ridge.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { mulberry32, ridgePoints } from '../../src/lib/journey/ridge';

const base = { seed: 42, width: 100, segments: 50, baseHeight: 2, amplitude: 10 };

describe('mulberry32', () => {
  it('é determinístico e fica em [0, 1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('ridgePoints', () => {
  it('gera segments + 1 pontos cobrindo a largura', () => {
    const pts = ridgePoints(base);
    expect(pts).toHaveLength(51);
    expect(pts[0][0]).toBe(-50);
    expect(pts[50][0]).toBe(50);
  });

  it('mesma seed, mesmo relevo; seed diferente, relevo diferente', () => {
    expect(ridgePoints(base)).toEqual(ridgePoints(base));
    expect(ridgePoints({ ...base, seed: 43 })).not.toEqual(ridgePoints(base));
  });

  it('altura fica entre baseHeight e baseHeight + 1.63 * amplitude', () => {
    for (const [, y] of ridgePoints(base)) {
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(2 + 1.63 * 10 + 1e-9);
    }
  });

  it('o vale rebaixa o relevo perto do centro', () => {
    const flat = ridgePoints(base);
    const valley = ridgePoints({ ...base, valleyCenter: 0, valleyDepth: 0.8, valleyWidth: 6 });
    const center = 25; // x = 0
    const relief = (pts, i) => pts[i][1] - base.baseHeight;
    expect(relief(valley, center)).toBeCloseTo(relief(flat, center) * 0.2, 6);
    expect(relief(valley, 0)).toBeCloseTo(relief(flat, 0), 3); // borda quase intacta
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- tests/unit/ridge.test.js`
Expected: FAIL com `Failed to resolve import "../../src/lib/journey/ridge"`

- [ ] **Step 3: Criar `src/lib/journey/ridge.js`**

```js
// Relevo procedural e determinístico para silhuetas de montanha (cena 3D e fundo SVG)

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Três oitavas de ruído de valor suavizado: picos largos + detalhes
const OCTAVES = [
  { knots: 4, weight: 1 },
  { knots: 9, weight: 0.45 },
  { knots: 21, weight: 0.18 },
];

export function ridgePoints({
  seed, width, segments, baseHeight, amplitude,
  valleyCenter = 0, valleyDepth = 0, valleyWidth = 1,
}) {
  const rand = mulberry32(seed);
  const octaves = OCTAVES.map((o) => ({
    ...o,
    values: Array.from({ length: o.knots + 1 }, () => rand()),
  }));

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let h = 0;
    for (const o of octaves) {
      const pos = t * o.knots;
      const k = Math.min(Math.floor(pos), o.knots - 1);
      const f = pos - k;
      const smooth = f * f * (3 - 2 * f);
      h += (o.values[k] + (o.values[k + 1] - o.values[k]) * smooth) * o.weight;
    }
    const x = -width / 2 + t * width;
    const valley = 1 - valleyDepth * Math.exp(-((x - valleyCenter) ** 2) / (2 * valleyWidth ** 2));
    points.push([x, baseHeight + h * amplitude * valley]);
  }
  return points;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS em todos

- [ ] **Step 5: Commit**

```bash
git add src/lib/journey/ridge.js tests/unit/ridge.test.js
git commit -m "Feat: Adiciona gerador procedural de relevo das montanhas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Cena 3D persistente, fallback e remoção das partículas antigas

**Files:**
- Create:
  - `src/lib/webgl.js`
  - `src/components/scene/config.js`, `SceneCanvas.js`, `Canvas3D.js`, `World.js`, `Atmosphere.js`, `JourneyCamera.js`, `MountainLayers.js`, `StaticBackdrop.js`
  - `tests/e2e/scene.spec.js`
- Modify: `package.json` (+`three`, `@react-three/fiber`, `@react-three/drei`, −`ogl`), `src/app/layout.js`
- Delete: `src/components/Particles.js`, `src/components/BackgroundParticles.js`

**Interfaces:**
- Consumes:
  - `journeyStore`, `useJourney`, `effectiveProgress` (Task 4)
  - `SEASONS` (Task 2)
  - `sampleSeason`, `clamp01` (Task 3)
  - `QUALITY_SETTINGS` (Task 3)
  - `ridgePoints` (Task 6)
- Produces:
  - `<SceneCanvas />`: div fixa com `aria-hidden="true"` e `data-scene="webgl" | "fallback"`.
  - `hasWebGL() => boolean`
  - `CAMERA_PATH: number[][]`, `MOUNTAIN_LAYERS: object[]`, `FOG_RANGE: [near, far]`

- [ ] **Step 1: Escrever o teste E2E `tests/e2e/scene.spec.js`**

```js
import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from './helpers';

test('cena WebGL monta um canvas oculto para leitores de tela', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');
  const scene = page.locator('[data-scene="webgl"]');
  await expect(scene).toHaveAttribute('aria-hidden', 'true');
  await expect(scene.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('o canvas persiste entre rotas (não remonta)', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-scene="webgl"] canvas');
  await expect(canvas).toHaveCount(1, { timeout: 15_000 });
  await canvas.evaluate((el) => { el.dataset.marker = 'same'; });
  await page.getByRole('link', { name: 'Certificados' }).first().click();
  await expect(page).toHaveURL(/\/certificates$/);
  await expect(page.locator('[data-scene="webgl"] canvas[data-marker="same"]')).toHaveCount(1);
});

test.describe('sem WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
        if (/webgl/i.test(type)) return null;
        return original.call(this, type, ...args);
      };
    });
  });

  test('mostra o fundo estático e o conteúdo continua acessível', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-scene="fallback"] svg')).toHaveCount(1);
    await expect(page.locator('[data-scene] canvas')).toHaveCount(0);
    await expect(page.locator('.hero-title')).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx playwright test tests/e2e/scene.spec.js`
Expected: FAIL (nenhum elemento `[data-scene]`)

- [ ] **Step 3: Trocar as dependências**

```bash
npm uninstall ogl
npm install three@^0.186 @react-three/fiber@^9 @react-three/drei@^10
```

- [ ] **Step 4: Remover as partículas antigas**

```bash
git rm src/components/Particles.js src/components/BackgroundParticles.js
```

Em `src/app/layout.js`, remover a linha `import BackgroundParticles from '../components/BackgroundParticles';` e o elemento `<BackgroundParticles />` (com a linha em branco ao redor).

- [ ] **Step 5: Criar `src/lib/webgl.js`**

```js
// true se o navegador consegue criar um contexto WebGL
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
```

- [ ] **Step 6: Criar `src/components/scene/config.js`**

```js
// Caminho da câmera: desce e avança para dentro da montanha (z negativo).
// Passa pelos vales das camadas (x ≈ 0).
export const CAMERA_PATH = [
  [0, 7, 24],
  [0, 5.5, 8],
  [-1.5, 4.2, -8],
  [1.5, 3.2, -24],
  [-1, 2.4, -40],
  [1, 1.8, -56],
  [0, 1.4, -72],
];

// Névoa: começa perto, fecha antes das camadas mais distantes
export const FOG_RANGE = [10, 70];

// Camadas de montanha espalhadas ao longo do caminho, com vale central para a câmera passar
export const MOUNTAIN_LAYERS = Array.from({ length: 9 }, (_, i) => ({
  seed: 101 + i * 37,
  x: 0,
  z: 4 - i * 11,
  width: 160,
  segments: 160,
  baseHeight: -1 + (i % 3) * 0.6,
  amplitude: 7 + (i % 3) * 2.5,
  valleyCenter: 0,
  valleyDepth: 0.8,
  valleyWidth: 18,
  bottom: -30,
}));
```

- [ ] **Step 7: Criar `src/components/scene/Atmosphere.js`**

```js
'use client';
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Fog } from 'three';
import { journeyStore } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { FOG_RANGE } from './config';

// Céu e névoa seguem estação e tema, com transição suave
export default function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const sky = useMemo(() => new Color(), []);
  const fog = useMemo(() => new Fog('#000000', FOG_RANGE[0], FOG_RANGE[1]), []);
  const target = useMemo(() => ({ sky: new Color(), fog: new Color() }), []);

  useEffect(() => {
    const { theme, seasonMix } = journeyStore.getState();
    const season = sampleSeason(SEASONS[theme], seasonMix);
    sky.set(season.sky);
    fog.color.set(season.fog);
    scene.background = sky;
    scene.fog = fog;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, sky, fog]);

  useFrame((state, delta) => {
    const { theme, seasonMix } = journeyStore.getState();
    const season = sampleSeason(SEASONS[theme], seasonMix);
    target.sky.set(season.sky);
    target.fog.set(season.fog);
    const k = 1 - Math.exp(-delta * 4);
    sky.lerp(target.sky, k);
    fog.color.lerp(target.fog, k);
    // No frameloop "demand" continua pedindo frames até convergir
    if (Math.abs(sky.r - target.sky.r) + Math.abs(sky.g - target.sky.g) + Math.abs(sky.b - target.sky.b) > 0.002) {
      state.invalidate();
    }
  });

  return null;
}
```

- [ ] **Step 8: Criar `src/components/scene/JourneyCamera.js`**

```js
'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3 } from 'three';
import { journeyStore, effectiveProgress } from '../../store/journey';
import { clamp01 } from '../../lib/journey/season';
import { CAMERA_PATH } from './config';

// Câmera percorre a curva conforme o progresso (amortecido; imediato em reduced motion)
export default function JourneyCamera() {
  const curve = useMemo(() => new CatmullRomCurve3(CAMERA_PATH.map((p) => new Vector3(...p))), []);
  const current = useRef(null);
  const position = useMemo(() => new Vector3(), []);
  const tangent = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    const journey = journeyStore.getState();
    const target = effectiveProgress(journey);
    if (current.current === null) current.current = target;
    const k = journey.reducedMotion ? 1 : 1 - Math.exp(-delta * 3);
    current.current += (target - current.current) * k;

    const t = clamp01(current.current);
    curve.getPointAt(t, position);
    curve.getTangentAt(t, tangent);
    state.camera.position.copy(position);
    state.camera.lookAt(position.x + tangent.x, position.y + tangent.y, position.z + tangent.z);

    if (Math.abs(target - current.current) > 1e-4) state.invalidate();
  });

  return null;
}
```

- [ ] **Step 9: Criar `src/components/scene/MountainLayers.js`**

```js
'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Shape, ShapeGeometry } from 'three';
import { journeyStore } from '../../store/journey';
import { SEASONS } from '../../lib/palette';
import { sampleSeason, clamp01 } from '../../lib/journey/season';
import { ridgePoints } from '../../lib/journey/ridge';
import { MOUNTAIN_LAYERS } from './config';

// Distância em que a camada atinge o tom "longe"
const FAR_DISTANCE = 60;

function buildGeometry(layer) {
  const points = ridgePoints(layer);
  const shape = new Shape();
  shape.moveTo(points[0][0], layer.bottom);
  points.forEach(([x, y]) => shape.lineTo(x, y));
  shape.lineTo(points[points.length - 1][0], layer.bottom);
  shape.closePath();
  return new ShapeGeometry(shape);
}

// Silhuetas em camadas; o tom vai de "perto" a "longe" conforme a distância da câmera
export default function MountainLayers() {
  const geometries = useMemo(() => MOUNTAIN_LAYERS.map(buildGeometry), []);
  const materials = useRef([]);
  const initialized = useRef(false);
  const tones = useMemo(() => ({ near: new Color(), mid: new Color(), far: new Color(), target: new Color() }), []);

  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  useFrame((state, delta) => {
    const { theme, seasonMix } = journeyStore.getState();
    const [near, mid, far] = sampleSeason(SEASONS[theme], seasonMix).mountains;
    tones.near.set(near);
    tones.mid.set(mid);
    tones.far.set(far);
    // Primeiro frame aplica a cor direto (sem piscar branco); depois amortece
    const k = initialized.current ? 1 - Math.exp(-delta * 6) : 1;
    initialized.current = true;
    let pending = false;

    MOUNTAIN_LAYERS.forEach((layer, i) => {
      const material = materials.current[i];
      if (!material) return;
      const t = clamp01(Math.abs(state.camera.position.z - layer.z) / FAR_DISTANCE);
      if (t < 0.5) tones.target.copy(tones.near).lerp(tones.mid, t * 2);
      else tones.target.copy(tones.mid).lerp(tones.far, (t - 0.5) * 2);
      material.color.lerp(tones.target, k);
      const c = material.color;
      if (Math.abs(c.r - tones.target.r) + Math.abs(c.g - tones.target.g) + Math.abs(c.b - tones.target.b) > 0.002) {
        pending = true;
      }
    });

    if (pending) state.invalidate();
  });

  return MOUNTAIN_LAYERS.map((layer, i) => (
    <mesh key={layer.seed} geometry={geometries[i]} position={[layer.x, 0, layer.z]}>
      <meshBasicMaterial
        ref={(m) => {
          materials.current[i] = m;
        }}
      />
    </mesh>
  ));
}
```

- [ ] **Step 10: Criar `src/components/scene/World.js`**

```js
'use client';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { journeyStore } from '../../store/journey';
import Atmosphere from './Atmosphere';
import JourneyCamera from './JourneyCamera';
import MountainLayers from './MountainLayers';

// Monta a cena; no frameloop "demand" qualquer mudança da store pede um frame
export default function World() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => journeyStore.subscribe(() => invalidate()), [invalidate]);

  return (
    <>
      <Atmosphere />
      <JourneyCamera />
      <MountainLayers />
    </>
  );
}
```

- [ ] **Step 11: Criar `src/components/scene/Canvas3D.js`**

```js
'use client';
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { journeyStore, useJourney } from '../../store/journey';
import { QUALITY_SETTINGS } from '../../lib/journey/quality';
import { CAMERA_PATH } from './config';
import World from './World';

// FPS abaixo de 45 durante a amostra (~2,5s) rebaixa a qualidade
const FPS_BOUNDS = () => [45, 1000];

export default function Canvas3D() {
  const quality = useJourney((s) => s.quality);
  const route = useJourney((s) => s.route);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const settings = QUALITY_SETTINGS[quality];
  const frameloop = hidden ? 'never' : route === 'frozen' ? 'demand' : 'always';

  return (
    <Canvas
      dpr={settings.dpr}
      frameloop={frameloop}
      camera={{ fov: 50, near: 0.1, far: 300, position: CAMERA_PATH[0] }}
      gl={{ antialias: quality === 'high', powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor bounds={FPS_BOUNDS} onDecline={() => journeyStore.getState().downgradeQuality()} />
      <World />
    </Canvas>
  );
}
```

- [ ] **Step 12: Criar `src/components/scene/StaticBackdrop.js`**

```js
'use client';
import { SEASONS } from '../../lib/palette';
import { sampleSeason } from '../../lib/journey/season';
import { ridgePoints } from '../../lib/journey/ridge';

const W = 1600;
const H = 900;

// Três camadas em coordenadas SVG (y para baixo: amplitude negativa sobe o relevo)
const LAYERS = [
  { seed: 7, base: 560, amp: 260, tone: 2 },
  { seed: 19, base: 660, amp: 220, tone: 1 },
  { seed: 31, base: 760, amp: 180, tone: 0 },
];

function layerPath({ seed, base, amp }) {
  const points = ridgePoints({ seed, width: W, segments: 80, baseHeight: base, amplitude: -amp });
  const ridge = points.map(([x, y]) => `L${(x + W / 2).toFixed(1)},${y.toFixed(1)}`).join(' ');
  return `M0,${H} ${ridge} L${W},${H} Z`;
}

// Fundo pintado para navegadores sem WebGL: primavera do tema atual
export default function StaticBackdrop({ theme }) {
  const season = sampleSeason(SEASONS[theme], 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width={W} height={H} fill={season.sky} />
      {LAYERS.map((layer) => (
        <path key={layer.seed} d={layerPath(layer)} fill={season.mountains[layer.tone]} />
      ))}
    </svg>
  );
}
```

- [ ] **Step 13: Criar `src/components/scene/SceneCanvas.js`**

```js
'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useJourney } from '../../store/journey';
import { hasWebGL } from '../../lib/webgl';
import StaticBackdrop from './StaticBackdrop';

// three/R3F só carregam no cliente, fora do bundle inicial
const Canvas3D = dynamic(() => import('./Canvas3D'), { ssr: false, loading: () => null });

const wrapperStyle = { position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' };

export default function SceneCanvas() {
  const [webgl, setWebgl] = useState(null);
  const quality = useJourney((s) => s.quality);
  const theme = useJourney((s) => s.theme);

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  if (webgl === false) {
    return (
      <div aria-hidden="true" data-scene="fallback" style={wrapperStyle}>
        <StaticBackdrop theme={theme} />
      </div>
    );
  }

  return (
    <div aria-hidden="true" data-scene="webgl" style={wrapperStyle}>
      {webgl && quality ? <Canvas3D /> : null}
    </div>
  );
}
```

- [ ] **Step 14: Montar no `src/app/layout.js`**

Adicionar o import junto dos imports da jornada:

```js
import SceneCanvas from '../components/scene/SceneCanvas';
```

Dentro de `<SettingsProvider>`, logo depois de `<SmoothScroll />`:

```jsx
          <SceneCanvas />
```

- [ ] **Step 15: Rodar os testes da cena**

Run: `npx playwright test tests/e2e/scene.spec.js`
Expected: `3 passed`

- [ ] **Step 16: Rodar toda a suíte**

Run: `npm test && npm run test:e2e`
Expected: todos os unitários e E2E passam

Conferir: `grep -rn "ogl\|Particles" src package.json` não deve retornar nada.

- [ ] **Step 17: Commit**

```bash
git add package.json package-lock.json src/lib/webgl.js src/components/scene src/app/layout.js tests/e2e/scene.spec.js
git commit -m "Feat: Adiciona cena 3D persistente com montanhas e estações" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Verificação final da fase

**Files:** nenhum arquivo novo. Ajustes de valores em `src/components/scene/config.js` só se a checagem visual pedir.

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: `✓ Compiled successfully` e a tabela de rotas, sem erros

- [ ] **Step 2: Suíte completa**

Run: `npm test && npm run test:e2e`
Expected: tudo passa

- [ ] **Step 3: Checagem visual no navegador (`npm run dev`)**

Em `http://localhost:3000`, conferir e anotar:
1. Topo da home: céu e montanhas de primavera, névoa visível, texto legível por cima.
2. Rolando até o fim: a câmera desce entre as camadas **sem atravessar montanha na frente do texto**, e as cores passam por verão e outono até o inverno.
3. O toggle 昼/夜 troca a cena e os tokens CSS suavemente.
4. `/certificates` mostra a cena parada no outono.
5. DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce": scroll nativo e câmera sem amortecimento.

Se a câmera cortar uma montanha (item 2), ajustar em `config.js` apenas `valleyDepth` (até 0.9), `valleyWidth` ou o `y` dos pontos de `CAMERA_PATH`. Rodar de novo `npm run test:e2e`.

- [ ] **Step 4: Lighthouse**

Com `npm run build && npm run start`, rodar o Lighthouse (Chrome DevTools) em `/`, nos modos desktop e mobile. Registrar Performance, Acessibilidade e LCP na descrição do commit ou PR. Meta: LCP < 2,5s e Acessibilidade ≥ 90. Se o LCP passar da meta, **reportar** os números antes de otimizar; otimização fica para a fase 6.

- [ ] **Step 5: Commit dos ajustes (se houver)**

```bash
git add src/components/scene/config.js
git commit -m "Style: Ajusta caminho da câmera e vales das montanhas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Cobertura da spec (fase 1)

| Requisito da spec | Task |
|-------------------|------|
| §3.1 árvore (SmoothScroll, SceneCanvas, World, JourneyCamera, Atmosphere, MountainLayers) | 5, 7 |
| §3.2 store `useJourney` com escritores/leitores | 4, 5, 7 |
| §3.3 Lenis via `gsap.ticker`, `lagSmoothing(0)` | 5 |
| §3.4 rota congelada (`FROZEN_PROGRESS`, `frameloop="demand"`, canvas não remonta) | 3, 4, 5, 7 |
| §3.5 dependências (sem postprocessing nesta fase) / remover `ogl` e partículas | 4, 5, 7 |
| §4.10 tokens 昼/夜 + `palette.js` como fonte única | 2 |
| §5 qualidade adaptativa, dpr, PerformanceMonitor, pausa com aba oculta | 3, 5, 7 |
| §6 canvas `aria-hidden`, reduced motion sem Lenis, fallback sem WebGL | 5, 7 |
| §7 Playwright: smoke, jornada, reduced motion | 1, 5, 7 |
| §8 fase 1 completa | 1–8 |

Itens da spec que ficam para fases seguintes: crossfade de câmera por seção em reduced motion (fase 4, junto com o grid do emakimono); animação de 1,2s da câmera até o ponto congelado (fase 6); smoke do redirect de `/contact` (fase 5).
