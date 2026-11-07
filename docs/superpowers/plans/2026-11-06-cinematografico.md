# Plano: portfólio cinematográfico (fases A–D)

- **Data:** 2026-11-06 · **Branch:** `feat/cinematografico`
- **Origem:** auditoria de 2026-11-06 (código + site ao vivo). O Raphael aprovou tudo, **menos mexer nos easter eggs**.
- **Fotos de projeto:** só as que existirem nos repositórios do GitHub dele. Sem foto no repo = sem foto no site.
- **Fluxo:** código da fase inteira primeiro, depois os testes e2e da fase (ver memória feedback-phase-workflow).

## Decisões de direção

- **Sistema visual:** "papel" (washi claro, tinta escura) só no que é papel de verdade (emakimono, carta do contato, tanzaku, meishi); "lavado de nanquim" (sem borda nem raio) para texto sobre a cena (Sobre, Experiência, abertura das seções). Some o card escuro arredondado repetido.
- **Metáfora única:** caminhada montanha adentro até o 奥の院 (santuário interno). As placas de estação 奥山線 viram 丁石 (chōishi), marcos de pedra que contam a distância: 五丁 → 四丁 → 三丁 → 二丁 → 一丁 → 奥の院.
- **Fontes:** Zen Kaku Gothic New (latim, corpo) no lugar da Inter; Shippori Mincho japonesa em subset com todos os kana/kanji do site (~66 KB por peso) no lugar das fontes do sistema.
- **Hero (desktop):** texto alinhado à esquerda, torii no terço direito (a câmera gira no hero e volta ao centro antes de cruzar o portão). Celular: torii em cima, texto embaixo. Pétalas fogem da área do texto.
- **HDRI:** o céu da cena é procedural; um HDRI no reflexo do rio mostraria outro céu. O rio reflete o próprio céu e as estrelas.

## Fase A — primeiro impacto

- [x] Qualidade automática pelo nome da GPU (alto/médio/mínimo), seletor vira ajuste manual, aviso "automático".
- [x] Cena começa logo após o load em GPU boa com mouse; o resto continua esperando interação/8 s.
- [x] Quadro-pôster: render real do hero (noite/dia × deitado/em pé) no lugar do SVG; cena 3D entra por cima sem mudar o enquadramento. Script `scripts/poster.mjs`.
- [x] Abertura na 1ª visita (desktop): fundo de tinta, ensō + 奥山, íris de nanquim abrindo, pôster aproximando, nome saindo do desfoque. Pular com clique/tecla/rolagem.
- [x] Som ambiente opcional (vento, água, fūrin, shishi-odoshi) por WebAudio, desligado por padrão.
- [x] Hero: composição, nome grande, 奥山 vertical, copy nova, seta com o conceito, menu "Início".
- [x] Fontes novas.

## Fase B — visual 3D

- [x] Pós-processamento: gradação por estação, rolagem suave das luzes altas, vinheta, grão, SMAA; raios da lua no alto.
- [x] Luz: contorno vindo da lua nos objetos, poças de luz das lanternas no chão e no caminho, sombras de contato.
- [x] Névoa baixa com ruído ao longo do caminho (GroundMist) e o fim da montanha dissolvendo na névoa do rodapé, sem corte reto.
- [x] Câmera em planos por seção + bambus e pétalas perto da lente + "respiro de nanquim" entre capítulos.
- [x] Komainu na mesma paleta (posterização) e com o contorno de luz.
- [x] Texturas Poly Haven como detalhe em tons de cinza (granito, iwakura, chão por estação). A lua ficou sem textura: o shader dela é o do easter egg do Tsukuyomi.
- [x] Rio: véu do céu e estrelas refletidas (a lua some depois do hero, então não há lua para refletir no fim).

## Fase C — conteúdo e interface

- [x] Fotos dos repositórios do GitHub (galeria + miniatura no emakimono e em /projects): docs/ de FIT.AI, FIT.AI API e Totem; repositório privado portifolio-freelance (Saeko, ARCA, Glow Laser); fotos dos amigurumis do catalago-amigurumis.
- [x] Fotos dos amigurumis num padrão só (fundo branco puro, mesma escala, sem a marca d'água; `scripts/amigurumis.py`): no rolo, as três peças numa folha branca que cabe no painel.
- [x] Galeria do projeto refeita: fotos empilhadas e a vizinha já carregada, troca em tira com paralaxe que continua de onde está se clicar de novo, arrastar para o lado, setas do teclado, quadro 2:1 (a proporção dos prints).
- [x] IMACARDIOS: ilustração do ECG a pincel que vira o diagrama de isolamento + estudo de caso.
- [x] Numeração sequencial no rolo, numerais daiji (壱 弐 参…) preenchidos.
- [x] Cards → papel / lavado de nanquim; rótulos em caixa-alta → versalete serifado ou tategaki.
- [x] 丁石 no lugar das placas de estação; ordem do Sobre no celular.
- [x] Copy: Sobre, Stack (onde cada ferramenta foi usada, sem Prettier/ESLint/Git), Projetos (bootcamp rotulado; rolo com projetos originais), EN "Formation" → "Program", erro do formulário com canal alternativo.

## Fase D — fechamento

- [x] Página /bastidores (making-of) bilíngue, ligada no rodapé e no projeto "Este Portfólio".
- [x] Rótulo de contexto no cursor ("Abrir" nos painéis do rolo; no celular não há cursor).
- [x] Crédito Poly Haven no rodapé.
- [ ] Domínio próprio: fica com o Raphael (compra e DNS).
