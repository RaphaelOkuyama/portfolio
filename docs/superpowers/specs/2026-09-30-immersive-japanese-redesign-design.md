# Redesign imersivo do portfólio — 奥山 (Okuyama, "montanha profunda")

- **Data:** 2026-09-30
- **Status:** aprovado em conversa; aguardando revisão desta spec
- **Autor:** Raphael Nobuyuki Haga Okuyama (ラファエル 信幸 芳賀 奥山)

## 1. Objetivo

Transformar o portfólio atual (Next.js 16 + React 19, já migrado para GSAP) numa experiência imersiva com Three.js e microinterações GSAP, inspirada na herança japonesa do autor.

Conceito central: o sobrenome Okuyama (奥山) significa "montanha profunda". Rolar a home é descer cada vez mais fundo numa montanha em névoa, no estilo ukiyo-e/sumi-e. As **quatro estações (四季)** avançam com o progresso do scroll: primavera → verão → outono → inverno.

### Critérios de sucesso

- A home funciona como uma jornada contínua com câmera única e transições de estação suaves.
- Todo o conteúdo continua acessível no DOM (SEO, leitores de tela, sem WebGL).
- LCP < 2,5s em desktop e em mobile médio (texto do hero não depende do canvas).
- 60 fps em desktop; ≥ 45 fps em mobile médio no modo `low`.
- `prefers-reduced-motion` resulta em site completo e estático.
- Nenhum erro de console nas rotas principais.

### Fora de escopo (v1)

- Som ambiente (fūrin, vento).
- Terceiro idioma completo em japonês (o japonês aparece só como elemento visual).
- CMS ou edição de conteúdo fora de `src/data/resume.js`.
- Modelos 3D realistas / PBR.

## 2. Decisões tomadas

| Tema | Decisão |
|------|---------|
| Navegação | Home = jornada única (hero → sobre → stack → projetos → experiência → contato). `/projects/[slug]` e `/certificates` continuam rotas próprias. `/contact` redireciona para `/#contato`. |
| Estilo 3D | 2.5D pintado: planos em camadas com shaders (névoa, papel washi, tinta), partículas com instancing, no máximo 2 modelos GLTF simples (torii e lanterna). |
| Tema | Toggle vira 昼/夜 (dia/noite). Idiomas continuam PT/EN. |
| Mobile | Mesma jornada em versão leve (`quality: 'low'`). |
| Arquitetura | React Three Fiber com um `<Canvas>` persistente no layout, store zustand e Lenis + ScrollTrigger. |

## 3. Arquitetura

### 3.1 Árvore

```
app/layout.js
├─ SettingsProvider            (idioma; tema 昼/夜 sincronizado com a store)
├─ SmoothScroll                (Lenis dirigido pelo gsap.ticker; chama ScrollTrigger.update)
├─ SceneCanvas                 (next/dynamic, ssr:false; fixed, inset:0, z-index:-1, aria-hidden)
│   └─ <Canvas> → <World>
│       ├─ JourneyCamera       (percorre CatmullRomCurve3 pelo progress)
│       ├─ Atmosphere          (céu, névoa, luz, paleta da estação, dia/noite)
│       ├─ MountainLayers
│       ├─ scenes/*            (uma por seção, ver §4)
│       └─ Effects             (bloom + grain; só quality high)
├─ Navbar, InkCursor, SocialSidebar
└─ <main>{children}</main>     (todo o conteúdo em DOM)
```

### 3.2 Store `useJourney` (zustand)

```js
{
  progress: 0,            // 0–1, progresso da página inteira
  section: 'hero',        // id da seção ativa
  sectionProgress: 0,     // 0–1 dentro da seção ativa
  seasonMix: 0,           // 0–3 contínuo (0 primavera, 1 verão, 2 outono, 3 inverno), derivado de progress
  theme: 'night',         // 'day' | 'night'
  quality: 'high',        // 'high' | 'low'
  reducedMotion: false,
  route: 'journey',       // 'journey' | 'frozen' (rotas fora da home)
  assetsProgress: 0,      // 0–100, alimenta o loader
}
```

- **Escritores:**
  - `SmoothScroll` → `progress`.
  - `<Section id>` (ScrollTrigger por seção) → `section`, `sectionProgress`.
  - `SettingsProvider` → `theme`.
  - `useQuality` → `quality`.
  - `matchMedia` → `reducedMotion`.
  - `usePathname` → `route`.
- **Leitores 3D:** usam `useJourney.getState()` dentro de `useFrame` (sem re-render do React por frame).
- **Leitores DOM:** usam seletores do zustand (`useJourney(s => s.section)`) só onde há mudança visual discreta.

### 3.3 Integração GSAP ↔ Three

- GSAP anima o DOM (SplitText, ScrambleText, DrawSVG, Flip, CustomEase, Draggable/Inertia/Observer) e também valores do Three (`gsap.to(material.uniforms.uReveal, { value: 1 })`).
- Plugins registrados num único ponto: `src/lib/gsap.js` (já existe; será estendido).
- Lenis roda via `gsap.ticker.add`, com `lagSmoothing(0)`.

### 3.4 Rotas

- `/` → `route: 'journey'`: câmera e estações seguem o scroll.
- `/projects/[slug]`, `/certificates`, 404 → `route: 'frozen'`: câmera anima (1,2s, `power2.inOut`) até um ponto fixo da curva e para. O `frameloop` passa a `demand`. Scroll nativo sem vínculo com a cena.
  - `/projects/[slug]` → ponto de outono, névoa leve.
  - `/certificates` → ponto de outono tardio, templo ao longe.
  - 404 → névoa densa (ver §4.9).
- `/contact` → redirect (`next.config` `redirects`) para `/#contato`.
- O canvas **não remonta** entre rotas.

### 3.5 Dependências

- **Adicionar:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `zustand`, `lenis`.
- **Remover:** `ogl`.
- **Componentes removidos/substituídos:**
  - `BackgroundParticles` e `Particles` → cenas 3D.
  - `LoadingScreen` → `EnsoLoader`.
  - `CustomCursor` → `InkCursor`.
  - `ScrollReveal` → `Reveal` onde ainda fizer sentido.

## 4. Roteiro de cenas

Cada seção da home é um `<Section id>` no DOM, pareado com uma cena 3D em `src/components/scene/scenes/`. Kanji de título aparece como elemento decorativo ao lado do título traduzido.

### 4.0 Loader — 序

- Ensō (círculo de pincel) em SVG desenhado com `DrawSVG` proporcional a `assetsProgress` (drei `useProgress`).
- Ao completar, a tinta se dissolve (máscara + opacity) e revela a cena.
- Sem WebGL: completa imediatamente.

### 4.1 Hero — 春 primavera

- **Cena:** camadas de montanha com névoa, torii em primeiro plano, pétalas de sakura (`InstancedMesh`) com vento em vertex shader; pétalas se afastam do cursor (uniform `uPointer`).
- **DOM:** nome com `ScrambleText` em ciclo, usando `profile` de `resume.js`: `Raphael Nobuyuki Haga Okuyama` → `ラファエル ノブユキ ハガ オクヤマ` → `ラファエル 信幸 芳賀 奥山`. Cargos (`hero.roles`) e indicador de scroll.
- **Transição:** no primeiro trecho do scroll a câmera atravessa o torii.

### 4.2 Sobre — 人 primavera → verão

- **Cena:** túnel de senbon torii; cada portal cruzado corresponde a uma linha do texto.
- **DOM:** `about.desc` revelado linha a linha com `SplitText` (lines + mask). Foto como kakejiku (rolo pendurado) que desenrola (`clip-path` + leve sombra). Botão "Baixar currículo" com carimbo ao clicar.

### 4.3 Stack — 技 verão

- **Cena:** jardim karesansui visto de cima; 9 pedras = 9 categorias de `techSection.categories`. Areia rastelada com displacement que reage ao cursor (só `high`). Vaga-lumes no modo noite.
- **DOM:** cada pedra tem um `<button>` correspondente (posicionado sobre ela ou numa lista acessível). Hover/foco mostra o nome; clique abre painel com os itens.
- **Mobile/low:** as pedras viram lista de botões; a areia fica estática.

### 4.4 Projetos — 作 outono (emakimono)

- **DOM:** seção fixada (pin) com trilho horizontal; scroll vertical vira horizontal (`containerAnimation`). Os projetos de `resume.js` viram painéis de washi (IMACARDIOS primeiro, ordem do array).
- **Cena:** folhas de momiji caindo; painéis desenrolam na entrada (shader/`clip-path` controlado por `containerAnimation`).
- **Clique:** `Flip` expande o painel e navega para `/projects/[slug]`.
- **Mobile:** swipe com `Draggable` + `Inertia` (sem pin).
- **Reduced motion:** grid simples.
- **Teclado:** painéis são `<a>` focáveis; foco rola o trilho até o painel.

### 4.5 Experiência — 歩 outono → inverno

- **DOM:** pincelada sumi-e vertical (SVG path) desenhada com `DrawSVG` em scrub. Em cada marco (3 experiências de `resume.js`), uma gota de tinta se espalha e o card entra.
- **Cena:** transição de cor para inverno; primeiros flocos.

### 4.6 Contato — 縁 inverno

- **Cena:** neve e rio escuro com lanternas flutuando.
- **DOM:** formulário (conteúdo de `contactPage`, lógica atual de `/api/contact` e `sonner`). No envio com sucesso, um papel dobra e vira lanterna que desce o rio (animação DOM → cena). Erro: toast atual, sem animação.

### 4.7 `/projects/[slug]`

- Layout atual preservado, adaptado aos novos tokens.
- Chegada via `Flip` a partir do painel do emakimono.
- Cena congelada no outono.

### 4.8 `/certificates` — 証

- Cartões com carimbo hanko vermelho entrando com `CustomEase` de impacto (escala 1.4 → 1 + leve shake) e stagger.

### 4.9 404 — 迷子 (maigo, "perdido")

- Névoa densa, trilha que se apaga, texto atual e botão de voltar.

### 4.10 Global

- **Tema 昼 (dia):** fundo washi claro, texto tinta sumi, acento shu (朱, vermelho-alaranjado).
- **Tema 夜 (noite, padrão):** índigo ai (藍), lua, lanternas com bloom, acento dourado.
- **Transição 昼/夜:** crossfade das uniforms de céu/luz (0,8s) + troca dos tokens CSS.
- **Tokens:** definidos em `globals.css` como variáveis CSS (`--bg-color`, `--text-primary`, `--text-secondary`, `--accent`, `--border`, `--card-bg`, mais `--ink`, `--paper`) para os dois temas; a cena lê as cores correspondentes de um módulo JS espelhado (`src/lib/palette.js`) para manter uma fonte única de valores.
- **InkCursor:** ponto de tinta com rastro de pincel (canvas 2D ou SVG), cresce sobre links/botões. Só em `(pointer: fine)`.

## 5. Performance

- **Detecção de qualidade (`useQuality`):** `high` se `(pointer: fine)`, largura ≥ 1024 e `getGPUTier` (detect-gpu) tier ≥ 2; senão `low`. O `PerformanceMonitor` do drei rebaixa para `low` se o FPS ficar < 45 por 2s. Nunca sobe de volta na mesma sessão.

| Parâmetro | high | low |
|-----------|------|-----|
| dpr | [1, 1.5] | 1 |
| Partículas (pétalas/folhas/neve) | ~1500 | ~300 |
| Postprocessing | bloom + grain | nenhum |
| Displacement da areia | sim | não |

- **Orçamento de assets:** cena inicial < 1,5 MB. Texturas em KTX2 ou WebP, geometria procedural sempre que possível, no máximo 2 GLTF com Draco.
- **Carregamento:** `SceneCanvas` via `next/dynamic` com `ssr: false`; texto do hero renderizado no servidor.
- **Pausa:** `frameloop="demand"` com aba oculta (`visibilitychange`) e em `route: 'frozen'`.
- **Limpeza:** geometrias/materiais descartados ao desmontar cenas (padrão do R3F + `dispose` manual em recursos criados fora do JSX).

## 6. Acessibilidade e fallback

- Todo texto em DOM com hierarquia de headings real; canvas com `aria-hidden="true"`.
- Elementos interativos da cena (pedras, painéis) sempre têm equivalente focável no DOM.
- Contraste AA nos dois temas.
- **`prefers-reduced-motion`:** Lenis desligado (scroll nativo), sem scrub nem pin; emakimono vira grid; câmera muda por seção com crossfade; ScrambleText mostra o nome final.
- **Sem WebGL** (falha ao criar o contexto): `SceneCanvas` renderiza fundo estático pintado (imagem da montanha por tema) e o site funciona inteiro.

## 7. Testes

- **Playwright** (adicionado na fase 1):
  - Smoke: `/`, `/projects/imacardios`, `/certificates`, rota inexistente → carregam sem erro de console.
  - Jornada: rolar até cada `<Section>` e verificar o heading visível.
  - Contato: envio com `/api/contact` interceptado (sucesso e erro).
  - `reducedMotion: 'reduce'`: seção de projetos renderiza como grid; todos os projetos visíveis.
  - `/contact` redireciona para `/#contato`.
- **Manual por fase:** Lighthouse (performance, acessibilidade) em desktop e mobile emulado; checagem visual nos dois temas.

## 8. Fases de entrega

Cada fase tem seu próprio plano de implementação e termina com o site publicável.

1. **Fundação:**
   - Dependências e remoção de `ogl` e partículas.
   - `useJourney`, `SmoothScroll`, `SceneCanvas`, `<Section>`.
   - Tokens 昼/夜 e `palette.js`, `useQuality`.
   - Cena mínima: montanhas em camadas + névoa + câmera na curva + mistura de estações.
   - Fallback sem WebGL.
   - Playwright com smoke.
2. **Loader + Hero:** `EnsoLoader`, sakura, torii, ScrambleText do nome, `InkCursor`, toggle 昼/夜 com transição.
3. **Sobre + Stack:** senbon torii + SplitText, kakejiku, jardim zen interativo.
4. **Projetos:** emakimono (pin horizontal, papel, momiji, Flip), swipe mobile, grid reduced-motion, teclado.
5. **Experiência + Contato:** pincelada sumi-e, neve e rio, lanterna no envio; mover formulário para a home e redirect de `/contact`.
6. **Rotas secundárias + polimento:** certificados com hanko, 404 迷子, rota congelada, orçamento de performance, Lighthouse, ajustes finos.

## 9. Riscos

- **Pin + Lenis + troca de rota:** ScrollTriggers precisam ser mortos/recalculados em cada navegação (`ScrollTrigger.refresh()` após montar; `useGSAP` faz o revert). Coberto pelos testes de jornada.
- **Peso de assets:** mitigado por geometria procedural e orçamento de 1,5 MB, verificado na fase 1.
- **Fontes com kanji:** fontes japonesas são pesadas; usar `next/font` com subset apenas dos caracteres usados (nome, kanji de seção) ou SVG para os kanji decorativos.
