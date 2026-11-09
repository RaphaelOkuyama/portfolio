// ============================================================
// FOTOS DOS PROJETOS: só imagens que existem nos repositórios do GitHub (prints da pasta docs/ de
// cada projeto, os do repositório portifolio-freelance e as fotos dos amigurumis do catálogo da
// Saeko), copiadas para /public/projects/<projeto>/. Projeto sem imagem no GitHub fica sem foto, a não
// ser os prints feitos com Playwright do próprio site no ar (este portfólio e o Star Wars Catalog) ou
// do projeto rodando localmente (o React Kanban, com o db.json do repositório);
// as APIs sem tela mostram as rotas (endpoints) no lugar da imagem.
// ============================================================
const shot = (dir, file, pt, en) => ({ src: `/projects/${dir}/${file}.png`, alt: { pt, en } });
const FIT_AI_SHOTS = [
  shot('fit-ai', 'home', 'Tela inicial', 'Home screen'),
  shot('fit-ai', 'montando-plano-de-treino-com-ia', 'Coach de IA montando o plano de treino', 'AI coach building the workout plan'),
  shot('fit-ai', 'plano-de-treino', 'Plano de treino', 'Workout plan'),
  shot('fit-ai', 'treino-do-dia', 'Treino do dia', "Today's workout"),
  shot('fit-ai', 'chatbot', 'Conversa com o coach de IA', 'Chat with the AI coach'),
  shot('fit-ai', 'estatisticas', 'Estatísticas', 'Statistics'),
  shot('fit-ai', 'profile', 'Perfil', 'Profile'),
  shot('fit-ai', 'tela-de-login', 'Tela de login', 'Sign-in screen'),
];
const FIT_AI_API_SHOTS = [shot('fit-ai-api', 'swagger', 'Documentação da API no Swagger', 'API documentation in Swagger')];
const TOTEM_SHOTS = [
  shot('totem', 'tela-01', 'Tela de boas-vindas', 'Welcome screen'),
  shot('totem', 'tela-02', 'Cardápio de combos', 'Combo menu'),
  shot('totem', 'cardapio-bebidas', 'Cardápio de bebidas', 'Drinks menu'),
  shot('totem', 'tela-03', 'Detalhes do produto', 'Product details'),
  shot('totem', 'sacola', 'Sacola', 'Bag'),
  shot('totem', 'finalizar-pedido', 'Finalizar pedido', 'Place the order'),
  shot('totem', 'checkout-stripe', 'Pagamento no Stripe Checkout', 'Stripe Checkout payment'),
  shot('totem', 'sucess-payment', 'Pagamento confirmado', 'Payment confirmed'),
  shot('totem', 'visualizar-pedidos-cpf', 'Consulta de pedidos por CPF', 'Order lookup by CPF'),
  shot('totem', 'meus-pedidos', 'Meus pedidos', 'My orders'),
];
// Saeko Artes: as fotos dos amigurumis do próprio catálogo (repositório catalago-amigurumis), em JPG
// fit 'contain': a peça inteira sobre o branco da foto (fundo e escala padronizados por scripts/amigurumis.py)
const piece = (file, pt, en) => ({ src: `/projects/saeko-artes/${file}.jpg`, alt: { pt, en }, fit: 'contain' });
const SAEKO_SHOTS = [
  piece('capivara', 'Amigurumi de capivara', 'Capybara amigurumi'),
  piece('leao', 'Amigurumi de leão', 'Lion amigurumi'),
  piece('panda', 'Chaveiro de panda em crochê', 'Crochet panda keychain'),
  piece('girassol', 'Chaveiro de girassol em crochê', 'Crochet sunflower keychain'),
  piece('elefante', 'Amigurumi de elefante', 'Elephant amigurumi'),
  piece('frajola', 'Amigurumi do Frajola', 'Sylvester amigurumi'),
  piece('pintinho', 'Amigurumi de pintinho', 'Chick amigurumi'),
  piece('uvinha', 'Boneca de crochê', 'Crochet doll'),
];
// Prints do repositório privado portifolio-freelance (public/projects): o site da Saeko, a landing
// da ARCA e a da Glow Laser, em JPG de 1600 px
const screen = (dir, file, n, pt, en) => ({ src: `/projects/${dir}/${file}-${n}.jpg`, alt: { pt: `${pt}, tela ${n}`, en: `${en}, screen ${n}` } });
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
const SAEKO_SITE = range(5).map((n) => screen('saeko-artes', 'site', n, 'Catálogo da Saeko Artes', 'Saeko Artes catalog'));
const ARCA_SHOTS = range(5).map((n) => screen('arca', 'arca', n, 'Landing page da ARCA', 'ARCA landing page'));
const GLOW_SHOTS = range(10).map((n) => screen('glow-laser', 'glow', n, 'Landing page da Glow Laser', 'Glow Laser landing page'));
// Prints feitos com Playwright: este site (com a cena 3D) e o Star Wars Catalog no ar
const site = (dir, file, pt, en) => ({ src: `/projects/${dir}/${file}.jpg`, alt: { pt, en } });
const PORTFOLIO_SHOTS = [
  site('portfolio-okuyama', 'site-1', 'Hero à noite, com o torii na cena 3D', 'Hero at night, with the torii in the 3D scene'),
  site('portfolio-okuyama', 'site-2', 'Seção Sobre, com a foto num kakejiku', 'About section, with the photo on a kakejiku'),
  site('portfolio-okuyama', 'site-3', 'Stack nas tiras de papel do Tanabata', 'Stack on Tanabata paper strips'),
  site('portfolio-okuyama', 'site-4', 'Projetos num emakimono que se desenrola com a rolagem', 'Projects on an emakimono that unrolls as you scroll'),
  site('portfolio-okuyama', 'site-5', 'Contato à beira do rio de lanternas', 'Contact by the lantern river'),
];
const KANBAN_SHOTS = [
  { src: '/projects/react-kanban/board-1.jpg', alt: { pt: 'Quadro com as tarefas nas três colunas', en: 'Board with tasks in the three columns' } },
  { src: '/projects/react-kanban/board-2.jpg', alt: { pt: 'Diálogo de nova tarefa, com situação e prioridade', en: 'New task dialog, with status and priority' } },
];
const STAR_WARS_SHOTS = [
  site('star-wars-catalog', 'site-3', 'Página de detalhes do X-Wing', 'X-Wing detail page'),
  site('star-wars-catalog', 'site-2', 'Lista de todas as espaçonaves', 'List of all spaceships'),
];
const imagesIn = (list, lang) => list.map(({ src, alt, fit }) => ({ src, alt: alt[lang], ...(fit ? { fit } : {}) }));

// Nome em latim e em japonês (kanji, katakana e hiragana); o hero cicla katakana ↔ hiragana
export const profile = {
  name: 'Raphael Nobuyuki Haga Okuyama',
  nameKanji: 'ラファエル 信幸 芳賀 奥山',
  nameKatakana: 'ラファエル ノブユキ ハガ オクヤマ',
  nameHiragana: 'らふぁえる のぶゆき はが おくやま',
};

export const resumeData = {
  pt: {
    nav: { home: "Início", projects: "Projetos", certificates: "Certificados", contact: "Contato", making: "Bastidores" },
    footer: {
      rights: "Todos os direitos reservados.",
      credit: { label: "Modelos 3D", by: "de", license: "CC BY 4.0", textures: "Texturas:" },
      lead: "Obrigado por adentrar a montanha comigo.",
      top: "Voltar ao topo",
      navTitle: "Navegação",
      socialTitle: "Onde me achar",
      timeTitle: "Agora em",
      cities: { saoPaulo: "São Paulo", tokyo: "Tóquio" },
      seasonLabel: "Microestação no Japão",
    },
    hero: {
      roles: ['Desenvolvedor full-stack', 'APIs, integrações e IA'],
      summary: 'Construí, em dupla, uma plataforma de telecardiologia que atende 42+ clínicas e por onde passam 2.000+ laudos assinados por mês.',
      // A seta da hero explica o caminho: 奥山 é a montanha, rolar é entrar nela
      scrollCue: '奥山 quer dizer montanha profunda. Role para entrar.',
      available: 'Disponível para',
      ctaProjects: 'Ver projetos',
      ctaContact: 'Fale comigo',
      omikuji: {
        open: 'Tirar a sorte',
        hint: 'Clique no torii para tirar a sorte',
        stick: 'Vareta nº',
        keep: 'Guardar a sorte',
        again: 'Tirar de novo',
        tie: 'Amarrar no galho',
        tieNote: 'No templo, quem tira 凶 amarra o papel num galho e deixa o azar para trás.',
        close: 'Fechar',
      }
    },
    about: {
      title: 'Sobre mim',
      lead: 'Comecei cuidando dos caixas de um supermercado. Hoje construo o back-end de uma plataforma médica e, nas horas vagas, pinto montanhas em shader.',
      paragraphs: [
        'Sou descendente de japoneses por parte de pai e de mãe, e a cultura japonesa sempre esteve presente na minha família: nos meus avós, nos costumes e nas pequenas tradições. 奥山 (Okuyama) significa "montanha profunda", algo que vem de longe, guarda histórias e segue existindo nas novas gerações.',
        'Na tecnologia encontrei um jeito de transformar curiosidade em coisas concretas: produtos que unem engenharia, interação e design. Fora do código: animes (alguns estão escondidos por aqui), jogos online e futebol.',
        'Hoje sou desenvolvedor full-stack, estudo Engenharia de Computação na FACENS e procuro um time onde eu possa construir produto de ponta a ponta.',
      ],
      // Os dois sobrenomes: o do pai (Okuyama) e o da mãe (Haga)
      names: [
        { kanji: '奥山', romaji: 'Okuyama', note: 'família do pai · "montanha profunda"' },
        { kanji: '芳賀', romaji: 'Haga', note: 'família da mãe' },
      ],
      btnResume: 'Baixar currículo',
      // O currículo pintado antes do download (ResumeBrush)
      resumePaint: {
        role: 'Desenvolvedor Full-Stack',
        sections: ['Experiência', 'Projetos', 'Formação', 'Tecnologias'],
        status: 'Preparando o currículo para download',
      },
      btnContact: 'Fale comigo'
    },
    techSection: {
      title: "Tecnologias & Ferramentas",
      hint: "Como os desejos do Tanabata, cada tira de papel é uma área. Escolha uma para ver as ferramentas.",
      toolsCount: "ferramentas",
      // kanji: 言 palavra · 表 a face · 裏 o avesso · 蔵 o depósito · 守 proteger · 流 o fluxo
      categories: [
        { name: "Linguagens", kanji: "言", items: ["TypeScript", "JavaScript", "Python", "SQL"] },
        { name: "Front-end & 3D", kanji: "表", items: ["React", "Next.js", "Tailwind CSS", "Shadcn/ui", "Vite", "GSAP", "Three.js", "React Three Fiber", "Zustand"] },
        { name: "Back-end & Arquitetura", kanji: "裏", items: ["Node.js", "NestJS", "Express", "Fastify", "Swagger/OpenAPI", "Stripe (Checkout e Webhooks)", "API Gemini (IA generativa)", "Multi-tenancy"] },
        { name: "Dados", kanji: "蔵", items: ["PostgreSQL", "MySQL", "MongoDB", "Prisma ORM", "Power BI"] },
        { name: "Testes & Segurança", kanji: "守", items: ["Jest", "Vitest", "Playwright", "Supertest", "Zod", "JWT", "OAuth", "2FA/OTP", "RBAC", "Argon2", "Helmet", "Rate limiting"] },
        { name: "DevOps & Processo", kanji: "流", items: ["Docker", "Git", "GitHub Actions (CI/CD)", "Vercel", "ESLint", "Prettier"] }
      ]
    },
    experienceTitle: "Experiência Profissional",
    experienceLabels: {
      current: "Atual",
      parallel: "em paralelo",
      education: "Formação",
      expected: "Conclusão prevista",
      viewProject: "Ver o projeto",
      tags: "Ferramentas",
    },
    experience: [
      {
        id: 1,
        start: "2022-04",
        end: "2025-02",
        role: "Técnico de TI e Analista de Dados",
        company: "Supermercado Mairinque",
        summary: "Suporte de TI e análise de dados para a operação das lojas.",
        highlights: [
          { value: "40+", text: "pontos de venda, self-checkouts, scanners e balanças funcionando por 3 anos sem interrupções críticas" },
          { text: "Relatórios e dashboards em Power BI e Excel para a gestão" },
          { text: "Identificação de inconsistências de cadastro no ERP VR Software" },
        ],
        tags: ["Power BI", "Excel", "ERP VR Software", "Hardware"],
      },
      {
        id: 2,
        start: "2025-02",
        end: null,
        type: "Estágio",
        role: "Estagiário de Desenvolvimento de Software e TI",
        company: "Prefeitura de Mairinque",
        summary: "Automação de processos internos e administração da infraestrutura de TI.",
        highlights: [
          { value: "-70%", text: "no tempo de geração de contratos administrativos, automatizada com Python" },
          { value: "-83%", text: "nos chamados de suporte no GLPI: de mais de 60 para menos de 10 por mês" },
          { text: "Administração de servidores, infraestrutura de rede e imagem customizada do Windows" },
        ],
        tags: ["Python", "GLPI", "Redes", "Windows"],
      },
      {
        id: 3,
        start: "2025-05",
        end: null,
        type: "Freelance",
        role: "Desenvolvedor Full-Stack",
        company: "IMACARDIOS",
        summary: "Construí, em dupla, o full-stack de uma plataforma B2B de telecardiologia em produção.",
        highlights: [
          { value: "42+", text: "clínicas usando a plataforma no Brasil e na América Latina" },
          { value: "2.000+", text: "laudos assinados por mês" },
          { value: "2FA", text: "obrigatório para médicos e administradores, com dados sensíveis isolados (LGPD)" },
        ],
        tags: ["NestJS", "Prisma", "PostgreSQL", "Next.js", "Swagger", "Jest"],
        link: "/projects/imacardios",
      },
    ],
    education: {
      course: "Engenharia de Computação",
      institution: "FACENS",
      end: "2026-12",
      summary: "Bacharelado no Centro Universitário Facens, em Sorocaba.",
    },
    certificatesPage: {
      title: "Certificados & Cursos",
      // {certs}, {bootcamps} e {formations} vêm da contagem dos dados
      summary: "{certs} certificados · {bootcamps} bootcamps · {formations} formação",
      filterLabel: "Filtrar por área",
      filterAll: "Todos",
      btnView: "Ver certificado",
      modules: "módulos",
      degreeTitle: "Formação acadêmica",
      degreeExpected: "Conclusão prevista",
      degreeDone: "Concluída em",
      viewer: { close: "Fechar", prev: "Certificado anterior", next: "Próximo certificado", issued: "emitido em", image: "Certificado" },
      areas: { full: "Bootcamps & Formações", front: "Front-end", back: "Back-end & Dados", base: "Fundamentos" },
    },
    // Agrupados por área; trilhas juntam módulos do mesmo curso (cada módulo tem o seu certificado)
    certificates: [
      { id: 1, area: "full", icon: "award", name: "Bootcamp: Gestão de Treinos com IA", institution: "Full Stack Club", date: "2026-03-11", hours: 10, image: { src: "/certificates/bootcamp-fit-ai.webp", width: 1600, height: 898 }, kind: "bootcamp" },
      { id: 2, area: "full", icon: "award", name: "Bootcamp Self Checkout", institution: "Full Stack Club", date: "2026-03-27", hours: 18, image: { src: "/certificates/bootcamp-self-checkout.webp", width: 1600, height: 898 }, kind: "bootcamp" },
      { id: 3, area: "full", icon: "award", name: "Formação Fullstack JavaScript", institution: "OneBitCode", date: "2025-10-07", hours: 200, image: { src: "/certificates/formacao-fullstack-javascript.webp", width: 1600, height: 1132 }, kind: "formation" },
      { id: 4, area: "front", icon: "react", name: "Projeto EAD Inspirado no Netflix", institution: "OneBitCode", date: "2025-10-07", hours: 56, image: { src: "/certificates/projeto-ead-netflix.webp", width: 1600, height: 1132 } },
      { id: 5, area: "front", icon: "next.js", name: "Curso de NextJS", institution: "OneBitCode", date: "2025-08-15", hours: 14, image: { src: "/certificates/nextjs.webp", width: 1600, height: 1132 } },
      { id: 10, area: "front", icon: "react", name: "Curso de React", institution: "OneBitCode", date: "2025-07-01", hours: 22, image: { src: "/certificates/react.webp", width: 1600, height: 1132 } },
      { id: 11, area: "front", icon: "css3", name: "CSS Moderno", institution: "OneBitCode", date: "2025-06-04", hours: 18, image: { src: "/certificates/css-moderno.webp", width: 1600, height: 1132 } },
      { id: 12, area: "front", icon: "bootstrap", name: "Bootstrap e SASS", institution: "OneBitCode", date: "2025-06-18", hours: 10, image: { src: "/certificates/bootstrap-sass.webp", width: 1600, height: 1132 } },
      { id: 22, area: "front", icon: "html5", name: "Curso de HTML5", institution: "OneBitCode", date: "2024-12-02", hours: 12, image: { src: "/certificates/html5.webp", width: 1600, height: 1132 } },
      { id: 21, area: "front", icon: "css3", name: "Curso de CSS3", institution: "OneBitCode", date: "2024-12-02", hours: 14, image: { src: "/certificates/css3.webp", width: 1600, height: 1132 } },
      { id: 6, area: "back", icon: "prisma", name: "SQL no NodeJS e Prisma ORM", institution: "OneBitCode", date: "2025-08-03", hours: 30, image: { src: "/certificates/sql-nodejs-prisma.webp", width: 1600, height: 1132 } },
      { id: 23, area: "back", icon: "node.js", name: "Trilha NodeJS", institution: "OneBitCode", modules: [{ label: "Curso de NodeJS", date: "2025-07-12", hours: 10, image: { src: "/certificates/nodejs-introducao.webp", width: 1600, height: 1132 } }, { label: "NodeJS em Aplicações Web", date: "2025-07-21", hours: 30, image: { src: "/certificates/nodejs-aplicacoes-web.webp", width: 1600, height: 1132 } }] },
      { id: 9, area: "back", icon: "postgresql", name: "Curso de Banco de Dados SQL", institution: "OneBitCode", date: "2025-07-24", hours: 22, image: { src: "/certificates/banco-de-dados-sql.webp", width: 1600, height: 1132 } },
      { id: 24, area: "base", icon: "javascript", name: "Trilha JavaScript", institution: "OneBitCode", modules: [{ label: "I", date: "2024-11-27", hours: 8, image: { src: "/certificates/javascript-1.webp", width: 1600, height: 1131 } }, { label: "II", date: "2024-12-17", hours: 12, image: { src: "/certificates/javascript-2.webp", width: 1600, height: 1132 } }, { label: "III", date: "2025-03-26", hours: 12, image: { src: "/certificates/javascript-3.webp", width: 1600, height: 1132 } }, { label: "IV", date: "2025-04-08", hours: 14, image: { src: "/certificates/javascript-4.webp", width: 1600, height: 1132 } }, { label: "V", date: "2025-04-16", hours: 12, image: { src: "/certificates/javascript-5.webp", width: 1600, height: 1132 } }, { label: "VI", date: "2025-05-02", hours: 12, image: { src: "/certificates/javascript-6.webp", width: 1600, height: 1132 } }] },
      { id: 14, area: "base", icon: "typescript", name: "Curso de TypeScript", institution: "OneBitCode", date: "2025-05-07", hours: 10, image: { src: "/certificates/typescript.webp", width: 1600, height: 1132 } },
      { id: 13, area: "base", icon: "git", name: "Git e GitHub", institution: "OneBitCode", date: "2025-05-18", hours: 12, image: { src: "/certificates/git-github.webp", width: 1600, height: 1132 } },
    ],
    projectsPage: { 
      title: "Projetos", 
      hint: "Role para desenrolar o emakimono. Cada painel é um projeto.",
      hintDrag: "Arraste o emakimono para o lado. Cada painel é um projeto.",
      btnAll: "Ver todos os projetos",
      allTitle: "Todos os {n} projetos",
      allDesc: "Landing pages, APIs, apps e estudos, com filtros por tipo.",
      subtitle: "Do produto em produção aos estudos. Para ver todos os repositórios,",
      githubLink: "visite meu perfil no GitHub",
      count: "{n} projetos",
      filterLabel: "Filtrar por tipo",
      filterAll: "Todos",
      types: { fullstack: "Full-stack", front: "Front-end", back: "Back-end & APIs", desktop: "Desktop" },
      featuredLabel: "Em produção",
      bootcampLabel: "Bootcamp",
      cursorOpen: "Abrir",
      btnMaking: "Ver os bastidores",
      caseTitle: "O caso",
      caseChallenge: "Desafio",
      caseDecisions: "O que decidi",
      caseResult: "Resultado",
      featuredStats: [
        { value: "42+", label: "clínicas no Brasil e na América Latina" },
        { value: "2.000+", label: "laudos assinados por mês" },
      ],
      groups: {
        "fit-ai": { title: "FIT.AI: Plataforma de Treinos", desc: "App mobile-first com coach de IA em tempo real e a API própria por trás dele." },
        devflix: { title: "DevFlix: Plataforma EAD", desc: "Plataforma de cursos inspirada na Netflix, com front-end e API de streaming." },
      },
      partsLabel: "Partes do projeto",
      btnDetails: "Ver detalhes",
      btnCode: "Ver no GitHub",
      btnDeploy: "Ver site",
      techs: "Tecnologias",
      features: "O que faz",
      aboutProject: "Sobre o projeto",
      projectImage: "Imagem do projeto",
      loadingText: "Carregando projeto...",
      btnBack: "Voltar",
      projectLabel: "Projeto",
      gallery: "Galeria",
      galleryPrev: "Foto anterior",
      galleryNext: "Próxima foto",
      galleryGoTo: "Ir para a foto {n}",
      prevProject: "Projeto anterior",
      nextProject: "Próximo projeto",
      overview: "Visão geral",
      status: "Status",
      statusLive: "No ar",
      statusCode: "Código aberto",
      techCount: "Tecnologias",
      featureCount: "Funcionalidades",
      role: "Papel",
      context: "Contexto",
      period: "Período",
      periodNow: "atual",
      apiTitle: "Rotas da API",
      apiAuth: "pede login",
      scrollCue: "Role para ler"
    },
    easterEgg: { message: "千羽鶴: mil tsurus de origami para te desejar sorte!" },
    projects: [
      {
        id: 11, slug: 'imacardios', type: 'fullstack', featured: true, title: 'IMACARDIOS: Telemedicina e Telelaudos',
        role: "Full-stack, em dupla", context: "Freelance remunerado", period: {start: "2025-05",end: null},
        stack: ['Next.js', 'React', 'NestJS', 'TypeScript', 'Prisma', 'PostgreSQL', 'Swagger', 'Jest', 'Playwright', 'Supertest'],
        shortDesc: 'Plataforma B2B de telecardiologia em produção: 42+ clínicas e 2.000+ laudos por mês.',
        longDesc: 'Freelance remunerado, desenvolvido em dupla. A IMACARDIOS é uma plataforma B2B de telecardiologia em produção, atendendo redes de saúde no Brasil e na América Latina, hoje com mais de 42 clínicas e mais de 2.000 laudos assinados por mês.\n\nProjetei o isolamento de dados sensíveis (CPF e diagnóstico fora do banco principal) e o isolamento entre clínicas em duas camadas: na aplicação e nas regras do Postgres. O back-end em NestJS + Prisma/PostgreSQL é documentado com Swagger e coberto por testes.',
        features: ['Plataforma multi-tenant com isolamento entre clínicas em duas camadas', 'Dados sensíveis (CPF e diagnóstico) fora do banco principal', '2FA obrigatório para médicos e administradores (LGPD)', 'Back-end em NestJS + Prisma/PostgreSQL', 'API documentada com Swagger/OpenAPI', 'Testes com Jest, Playwright e Supertest', 'Em produção no Brasil e na América Latina'],
        repoLink: null, deployLink: 'https://app.imacardios.com',
        caseStudy: {
          challenge: 'Laudos de cardiologia de dezenas de clínicas na mesma plataforma, com dados de saúde protegidos pela LGPD: uma clínica nunca pode enxergar os pacientes de outra.',
          decisions: [
            'Isolamento entre clínicas em duas camadas: a API prende cada consulta à clínica de quem pediu, e as regras do Postgres repetem a trava dentro do banco.',
            'CPF e diagnóstico guardados fora do banco principal: um vazamento dele não expõe os dados mais sensíveis.',
            '2FA obrigatório para médicos e administradores.',
            'API em NestJS + Prisma documentada no Swagger e coberta por testes (Jest, Supertest e Playwright).',
          ],
          result: 'Em produção no Brasil e na América Latina: mais de 42 clínicas e mais de 2.000 laudos assinados por mês.',
          diagram: {
            alt: 'Diagrama: as clínicas passam pela API, que isola os dados por clínica, e pelo PostgreSQL, que repete o isolamento nas suas regras; CPF e diagnóstico ficam num banco separado.',
            clinic: 'Clínica',
            app: 'API NestJS · camada 1: cada consulta presa à clínica',
            db: 'PostgreSQL · camada 2: regras por clínica',
            vault: 'CPF e diagnóstico à parte',
            caption: 'Duas travas independentes entre as clínicas, e os dados mais sensíveis fora do banco principal.',
          },
        },
        images: [], imageMobile: false, image: null
      },
      {
        id: 12, slug: 'saeko-artes', type: 'front', title: 'Saeko Artes: Catálogo de Amigurumis',
        role: "Front-end", context: "Cliente real", period: {start: "2026-04",end: "2026-04"},
        caseStudy: {challenge: "Um ateliê de crochê precisava vender as peças pela internet sem montar uma loja virtual: nada de checkout, cadastro ou banco de dados para manter, mas com o frete real dos Correios calculado na hora.",decisions: ["O pedido termina no WhatsApp, onde o ateliê já atende: a mensagem chega montada com as peças, as quantidades, o frete, o CEP e o total.","Frete cotado de verdade na API do Melhor Envio, dentro de uma Server Action: o token fica no servidor e o navegador recebe só a opção mais barata entre PAC e SEDEX, com o prazo.","Server Components por padrão; o modelo 3D do hero chega depois do texto (import dinâmico, sem SSR) e não pesa no primeiro carregamento.","Cada uma das 28 peças tem página estática própria, com metadata e Open Graph: o link compartilhado já aparece com a foto da peça."],result: "Catálogo no ar com as 28 peças, frete calculado na hora e o pedido chegando pronto no WhatsApp, sem banco de dados nem painel para manter."},
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'React Three Fiber', 'Zustand', 'Framer Motion', 'Lenis'],
        shortDesc: 'Catálogo de um ateliê de crochê com frete real dos Correios, cotado pelo Melhor Envio, e pedido pelo WhatsApp.',
        longDesc: 'Landing page e catálogo digital da Saeko Artes, ateliê artesanal de amigurumis de Mairinque (SP). As peças aparecem numa vitrine editorial minimalista, o frete dos Correios é cotado de verdade pela API do Melhor Envio e o pedido é finalizado no WhatsApp, sem checkout, cadastro ou banco de dados.\n\nServer Components por padrão, com "use client" só onde há interação: o carrinho, as animações e o modelo 3D do hero. Cada uma das 28 peças tem uma página estática própria, com metadata e Open Graph.',
        features: ['Modelo 3D de amigurumi no hero com React Three Fiber, carregado sem pesar no LCP', 'Frete real pela API do Melhor Envio numa Server Action: o token nunca chega ao navegador', 'Carrinho em drawer com Zustand e subtotal recalculado em tempo real', 'Pedido montado automaticamente na mensagem do WhatsApp', '28 páginas de produto estáticas com metadata e Open Graph', 'Sitemap e robots gerados dinamicamente'],
        repoLink: 'https://github.com/RaphaelOkuyama/catalago-amigurumis', deployLink: 'https://catalago-amigurumis.vercel.app',
        images: imagesIn([...SAEKO_SITE, ...SAEKO_SHOTS], 'pt'), imageMobile: false, imageProducts: true, image: null
      },
      {
        id: 1, slug: 'fit-ai-frontend', origin: 'bootcamp', type: 'front', group: 'fit-ai', part: 'App', title: 'FIT.AI: App de Treinos',
        role: "Front-end", context: "Bootcamp Full Stack Club", period: {start: "2026-03",end: "2026-03"},
        caseStudy: {challenge: "Montar um plano de treino exige saber peso, altura, objetivo e rotina da pessoa, e um formulário longo afasta justamente quem está começando.",decisions: ["O cadastro é uma conversa: o coach de IA (Gemini 2.5 Flash) coleta os dados e, no fim, já monta o plano da semana.","Respostas em streaming, palavra a palavra, pelo AI SDK: a conversa nunca parece travada.","Contrato tipado de ponta a ponta: as rotas da API em Fastify são validadas com Zod, o OpenAPI sai delas e o Orval gera o cliente do front. Uma mudança na API quebra o build, não o usuário.","Server Components para buscar os dados e Server Actions para as mudanças; JavaScript no navegador só onde há interação."],result: "Do primeiro login ao plano de treino numa conversa só, com o app e a API falando o mesmo contrato tipado."},
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Google Gemini', 'Better Auth', 'Orval'],
        shortDesc: 'App mobile-first de treinos com coach de IA em tempo real.',
        longDesc: 'Projeto do bootcamp da Full Stack Club. O FIT.AI é um aplicativo mobile-first de gestão de treinos com personal trainer virtual integrado. Desenvolvido com Next.js 16 e React 19, o app oferece um onboarding conversacional com IA (Google Gemini 2.5 Flash), onde o coach coleta seus dados físicos e monta um plano de treino personalizado.\n\nAs respostas do coach chegam em streaming via @ai-sdk/react, palavra a palavra, enquanto os dados vêm de Server Components e as mutações passam por Server Actions.',
        features: ['Chat com coach de IA em tempo real', 'Onboarding inteligente e conversacional', 'Dashboard com streak e estatísticas', 'Plano de treino semanal personalizado pela IA', 'Server Components + Server Actions', 'Autenticação com Google OAuth'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-frontend', deployLink: 'https://gestao-de-treino-frontend.onrender.com',
        images: imagesIn(FIT_AI_SHOTS, 'pt'), imageMobile: true, image: null
      },
      {
        id: 2, slug: 'fit-ai-api', origin: 'bootcamp', type: 'back', group: 'fit-ai', part: 'API', title: 'FIT.AI: API',
        role: "Back-end", context: "Bootcamp Full Stack Club", period: {start: "2026-03",end: "2026-03"},
        stack: ['Node.js', 'TypeScript', 'Fastify', 'Prisma', 'PostgreSQL', 'Google Gemini', 'Better Auth', 'Docker', 'Swagger/OpenAPI'],
        shortDesc: 'API da FIT.AI: treinos, progresso e o coach de IA com respostas em streaming.',
        longDesc: 'Projeto do bootcamp da Full Stack Club. Back-end da plataforma FIT.AI. A API gerencia usuários, planos de treino, exercícios, sessões e estatísticas de progresso. O ponto central é a integração com o Google Gemini para geração de planos de treino personalizados e respostas em streaming do coach virtual.',
        features: ['Integração com Google Gemini', 'Streaming de respostas do coach via SSE', 'Documentação automática com Swagger/OpenAPI', 'Autenticação com Google OAuth', 'Containerizado com Docker', 'Arquitetura em camadas com Fastify', 'Prisma ORM com PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-api', deployLink: 'https://gestao-de-treino-api.onrender.com',
        images: imagesIn(FIT_AI_API_SHOTS, 'pt'), imageMobile: false, image: null
      },
      {
        id: 3, slug: 'totem-autoatendimento', origin: 'bootcamp', type: 'fullstack', title: 'Totem de Autoatendimento',
        role: "Full-stack", context: "Bootcamp Full Stack Club", period: {start: "2026-02",end: "2026-03"},
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Prisma', 'PostgreSQL', 'Stripe'],
        shortDesc: 'Autoatendimento para totem touchscreen, do cardápio ao pagamento com Stripe.',
        longDesc: 'Projeto do bootcamp da Full Stack Club. Sistema de autoatendimento feito para rodar num totem touchscreen físico. O fluxo cobre da seleção do tipo de pedido até o pagamento integrado com Stripe, passando por cardápio com categorias, detalhes do produto e sacola.',
        features: ['Interface otimizada para touchscreen', 'Cardápio com categorias dinâmicas', 'Sacola com controle de quantidade e total', 'Pagamento integrado com Stripe Checkout', 'Tela de confirmação de pagamento em tempo real', 'Consulta de pedidos por CPF', 'Banco de dados com Prisma + PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/totem-autoatendimento', deployLink: 'https://totem-autoatendimento.vercel.app',
        images: imagesIn(TOTEM_SHOTS, 'pt'), imageMobile: true, image: null
      },
      {
        id: 13, slug: 'arca-construtora', type: 'front', title: 'ARCA: Landing Page para Construtora',
        role: "Front-end", context: "Projeto conceito", period: {start: "2026-04",end: "2026-04"},
        caseStudy: {challenge: "Uma construtora de alto padrão vende sofisticação: a página precisava da presença de um portfólio de arquitetura, com vídeo, animação e profundidade, sem ficar pesada no celular.",decisions: ["A obra sobe com a rolagem: 63 quadros desenhados num canvas e presos ao scroll, que só começam a baixar quando a seção se aproxima da tela.","O peso se ajusta ao aparelho: no celular entram 1 a cada 3 quadros (cerca de 21 imagens) e o vídeo do hero é um vídeo nativo que só baixa quando toca; no desktop, o vídeo de drone é desenhado num canvas, com o enquadramento corrigido.","Cards de obras com profundidade de verdade: duas camadas (o fundo e o recorte do prédio) e um reflexo de luz que acompanha a inclinação do mouse.","Uma página 100% estática, em treze blocos independentes, do preloader ao rodapé."],result: "Uma landing page que se comporta como portfólio de arquitetura e manda só um terço dos quadros da animação para quem chega pelo celular."},
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Canvas API'],
        shortDesc: 'Landing page de alto padrão com animações em canvas e storytelling guiado pelo scroll.',
        longDesc: 'Landing page institucional (projeto conceito) para uma construtora de alto padrão. O foco está na camada visual: animações em canvas, storytelling controlado pelo scroll e microinterações que transmitem a sofisticação de um portfólio arquitetônico.\n\nUma única página, 100% estática, composta por treze blocos independentes, do preloader ao rodapé.',
        features: ['Preloader com um prédio que se ergue andar por andar e partículas em canvas', 'Vídeo de drone no hero desenhado em canvas no desktop e vídeo nativo leve no celular', 'Sequência de 63 quadros da obra sincronizada com o scroll, com carregamento sob demanda', 'Cards de obras com parallax 3D e reflexo de luz seguindo o mouse', 'Contadores animados, depoimentos em carrossel e FAQ em accordion'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-construtoras', deployLink: 'https://landing-page-exemple-construtoras.vercel.app',
        images: imagesIn(ARCA_SHOTS, 'pt'), imageMobile: false, image: null
      },
      {
        id: 14, slug: 'glow-laser', type: 'front', title: 'GLOW LASER: Landing Page para Clínica',
        role: "Front-end", context: "Projeto conceito", period: {start: "2026-04",end: "2026-04"},
        caseStudy: {challenge: "Clínicas de estética disputam atenção no celular: a página precisava gerar desejo e, principalmente, transformar a visita em conversa no WhatsApp.",decisions: ["Duas ferramentas de captação: um quiz de 4 perguntas que sugere protocolo e número de sessões, e uma calculadora de investimento em reais. As duas terminam no WhatsApp com o resultado.","Comparador antes e depois arrastável (mouse e toque) que mexe no clip-path direto, quadro a quadro, sem re-render do React; até o primeiro toque, ele se demonstra sozinho.","Vídeo no hero com plano B: se o navegador do celular bloqueia o autoplay, o vídeo começa no primeiro toque na tela.","Server Components por padrão; só as partes com interação (rolagem, arraste, quiz e calculadora) rodam no navegador."],result: "Todos os caminhos da página levam ao WhatsApp, e quem chega lá já sabe o protocolo, as sessões e o investimento estimados."},
        stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS v4'],
        shortDesc: 'Landing page com quiz de diagnóstico e calculadora de investimento que levam ao WhatsApp.',
        longDesc: 'Landing page (projeto conceito) para clínicas de estética e depilação a laser, com identidade editorial e duas ferramentas de captação de clientes: um quiz de diagnóstico e uma calculadora de investimento. Todos os caminhos levam ao WhatsApp.\n\nServer Components por padrão e "use client" só nas partes interativas.',
        features: ['Comparador antes e depois com divisor arrastável (mouse e toque), sem re-render do React', 'Quiz de 4 perguntas que sugere protocolo e número de sessões', 'Calculadora de investimento em tempo real, em reais', 'Hero com vídeo e plano B para o autoplay bloqueado no celular', 'Header com barra de progresso de leitura e seção ativa destacada'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-clinicas', deployLink: 'https://landing-page-exemple-clinicas.vercel.app',
        images: imagesIn(GLOW_SHOTS, 'pt'), imageMobile: false, image: null
      },
      {
        id: 15, slug: 'portfolio-okuyama', type: 'front', title: 'Este Portfólio: a Montanha Okuyama',
        role: "Design, 3D e código", context: "Projeto pessoal", period: {start: "2025-12",end: null},
        stack: ['Next.js 16', 'React 19', 'Three.js', 'React Three Fiber', 'GSAP', 'Zustand', 'Lenis', 'Playwright'],
        shortDesc: 'Portfólio imersivo em 3D: uma caminhada para dentro da montanha pelas quatro estações.',
        longDesc: 'Este site. Um portfólio imersivo em que rolar a página é adentrar a montanha (奥山, "montanha profunda"): a cena 3D passa pelas quatro estações, do sakura à neve, com torii, jardim zen e um rio de lanternas no fim.\n\nCena em Three.js com React Three Fiber e shaders próprios, animações com GSAP e testes unitários (Vitest) e e2e (Playwright) cobrindo cada seção.',
        features: ['Cena 3D com estações, névoa, floresta, jardim zen e rio desenhados com shaders próprios', 'Projetos num emakimono que se desenrola na horizontal com o scroll', 'Formulário de contato que vira uma lanterna descendo o rio', 'Imagens de compartilhamento geradas por projeto e dados estruturados de Pessoa', 'Fundo pintado em SVG para quem não tem WebGL', 'Testes unitários e e2e de cada seção'],
        repoLink: 'https://github.com/RaphaelOkuyama/portfolio', deployLink: 'https://portfolio-raphael-okuyama.vercel.app',
        images: imagesIn(PORTFOLIO_SHOTS, 'pt'), imageMobile: false, image: null
      },
      { 
        id: 4, slug: 'devflix-frontend', type: 'front', group: 'devflix', part: 'Front-end', title: 'DevFlix Frontend', 
        role: "Front-end", context: "Curso OneBitCode", period: {start: "2025-08",end: "2025-09"},
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'Front-end de uma plataforma de cursos inspirada na Netflix.',
        longDesc: 'Front-end da DevFlix, uma plataforma de cursos online com a navegação da Netflix: vitrines por categoria, episódios e progresso de cada aula. Consome a API da DevFlix com Axios e SWR.',
        features: ['Interface responsiva, pensada primeiro para o celular', 'Páginas renderizadas no servidor (SSR)', 'Dados da API com Axios e cache com SWR', 'Estilos em módulos Sass'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 5, slug: 'devflix-backend', type: 'back', group: 'devflix', part: 'API', title: 'DevFlix API', 
        role: "Back-end", context: "Curso OneBitCode", period: {start: "2025-08",end: "2025-09"},
        endpoints: [{method: "POST",path: "/auth/register"},{method: "POST",path: "/auth/login"},{method: "GET",path: "/courses/featured",auth: true},{method: "GET",path: "/courses/search",auth: true},{method: "GET",path: "/episodes/stream",auth: true},{method: "POST",path: "/episodes/:id/watchTime",auth: true},{method: "POST",path: "/favorites",auth: true},{method: "GET",path: "/users/current/watching",auth: true}],
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT'], 
        shortDesc: 'API da DevFlix: cursos, episódios, favoritos e login com JWT.',
        longDesc: 'API REST da DevFlix em Express, Sequelize e PostgreSQL. Guarda o catálogo de cursos e episódios, os favoritos e o progresso de cada aluno, com login por JWT e um painel administrativo em AdminJS.',
        features: ['Login com JWT', 'Categorias, cursos, episódios e favoritos', 'Progresso de visualização por aluno', 'Painel administrativo com AdminJS', 'Modelo relacional com Sequelize e PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 6, slug: 'player-electron', type: 'desktop', title: 'Music Player Desktop', 
        role: "Desktop", context: "Projeto de estudo", period: {start: "2025-09",end: "2025-10"},
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'Player de música desktop com Electron, tocando arquivos locais.',
        longDesc: 'App desktop multiplataforma feito com Electron e React. Lê as músicas direto do computador, monta playlists e controla a reprodução, coisas que uma página no navegador não consegue fazer sozinha.',
        features: ['Importação de músicas do computador', 'Play, pause e próxima faixa', 'Criação de playlists', 'Acesso ao sistema de arquivos pelo Electron'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 7, slug: 'react-kanban', type: 'front', title: 'React Kanban', 
        role: "Front-end", context: "Projeto de estudo", period: {start: "2025-09",end: "2025-09"},
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Quadro Kanban em que as tarefas avançam de coluna em coluna, com prioridade.',
        longDesc: 'Quadro Kanban em React e TypeScript: as tarefas nascem num diálogo acessível do Radix UI, validadas com Zod, e avançam de A fazer para Em progresso e Concluídas. Os dados ficam numa API REST simulada com o json-server.',
        features: ['Tarefas que avançam entre as colunas (A fazer, Em progresso, Concluídas)', 'Criar e excluir tarefas, com prioridade (json-server)', 'Validação de formulários com Zod', 'Componentes acessíveis com Radix UI'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban', deployLink: null, images: imagesIn(KANBAN_SHOTS, 'pt'), imageMobile: false, image: null
      },
      { 
        id: 8, slug: 'api-leadmagnet', type: 'back', title: 'API Lead Magnet', 
        role: "Back-end", context: "Curso OneBitCode", period: {start: "2025-09",end: "2025-09"},
        endpoints: [{method: "GET",path: "/api/leads"},{method: "POST",path: "/api/leads"},{method: "PUT",path: "/api/leads/:id"},{method: "POST",path: "/api/groups/:groupId/leads"},{method: "POST",path: "/api/campaigns"},{method: "PUT",path: "/api/campaigns/:campaignId/leads/:leadId"},{method: "GET",path: "/api/status"}],
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'API REST para organizar leads em grupos e campanhas.',
        longDesc: 'API REST em Express e TypeScript para guardar leads e organizá-los em grupos e campanhas. Toda entrada é validada com Zod e os dados ficam no PostgreSQL via Prisma.',
        features: ['Cadastro e consulta de leads', 'Leads organizados em grupos e campanhas', 'Validação das requisições com Zod', 'Prisma com PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 9, slug: 'api-library', type: 'back', title: 'Library Auth API', 
        role: "Back-end", context: "Curso OneBitCode", period: {start: "2025-09",end: "2025-09"},
        endpoints: [{method: "POST",path: "/auth/register"},{method: "POST",path: "/auth/login"},{method: "GET",path: "/api/books"},{method: "POST",path: "/api/books"},{method: "PUT",path: "/api/books/:id"},{method: "POST",path: "/api/loans",auth: true},{method: "POST",path: "/api/loans/:id/return"}],
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'API de biblioteca com login por JWT e senhas com hash.',
        longDesc: 'Simula o back-end de uma biblioteca: livros, usuários e empréstimos. As senhas são guardadas com hash Bcrypt, nunca em texto puro, e as rotas sensíveis só respondem com um token JWT válido.',
        features: ['Senhas com hash Bcrypt', 'Rotas protegidas por token JWT', 'Controle de empréstimos', 'Identificadores únicos com UUID'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 10, slug: 'star-wars-catalog', type: 'front', title: 'Star Wars Catalog', 
        role: "Front-end", context: "Projeto de estudo", period: {start: "2025-08",end: "2025-08"},
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Catálogo de naves de Star Wars com dados da SWAPI.',
        longDesc: 'Catálogo em Next.js que busca as naves na API pública de Star Wars (SWAPI) e gera uma página de detalhes para cada uma, com rotas dinâmicas.',
        features: ['Dados da API pública SWAPI', 'Carregamento assíncrono dos dados', 'Navegação por categorias', 'Página de detalhes com rota dinâmica'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog', deployLink: 'https://star-wars-spaceships-catalog.vercel.app', images: imagesIn(STAR_WARS_SHOTS, 'pt'), imageMobile: false, image: null
      },
    ],
    contactPage: {
      title: "Vamos conversar",
      subtitle: "Me conte sobre a vaga, o projeto ou a ideia. Eu respondo pelo e-mail que você deixar.",
      availabilityLabel: "Disponível para",
      availability: ["CLT", "PJ", "Freelance"],
      location: "São Paulo, Brasil",
      channels: "Ou me chame direto",
      copyEmail: "Copiar e-mail",
      copied: "E-mail copiado!",
      letter: "手紙",
      lanternHint: "Ao enviar, sua mensagem desce o rio numa lanterna.",
      meishi: {
        open: "Pegar meu cartão",
        title: "Cartão de visita",
        note: "No Japão, o meishi é entregue com as duas mãos, virado para quem recebe. Aponte a câmera para o QR no verso e salve meu contato.",
        flip: "Virar cartão",
        save: "Salvar contato",
        close: "Fechar",
        qr: "QR code com o meu contato",
      },
      form: {
        nameLabel: "Nome", namePlaceholder: "Como posso te chamar?",
        emailLabel: "E-mail", emailPlaceholder: "seu@email.com",
        messageLabel: "Mensagem", messagePlaceholder: "Conte sobre a vaga, o projeto ou a ideia...",
        btn: "Enviar mensagem",
      },
      errors: {
        name: { required: "Diga como posso te chamar.", too_long: "Nome longo demais." },
        email: { required: "Informe seu e-mail para eu responder.", invalid: "Esse e-mail não parece válido." },
        message: { required: "Escreva sua mensagem.", too_long: "Mensagem longa demais." },
      },
      sent: {
        title: "Sua lanterna já está no rio, {name}.",
        text: "Recebi sua mensagem e vou responder pelo e-mail que você deixou.",
        again: "Enviar outra mensagem",
      },
      sending: "Enviando...",
      toast: {
        loading: "Enviando mensagem...",
        success: "Mensagem enviada com sucesso! Ela desce o rio numa lanterna.",
        error: "Não deu para enviar agora. Tente de novo ou escreva para raphaelokuyama123@gmail.com.",
        network: "Erro de conexão. Verifique sua rede.",
        rate: "Muitas mensagens em pouco tempo. Tente de novo em alguns minutos.",
        unavailable: "O envio está fora do ar agora. Escreva direto para raphaelokuyama123@gmail.com."
      }
    }
  },

  en: {
    nav: { home: "Home", projects: "Projects", certificates: "Certificates", contact: "Contact", making: "Behind the scenes" },
    footer: {
      rights: "All rights reserved.",
      credit: { label: "3D models", by: "by", license: "CC BY 4.0", textures: "Textures:" },
      lead: "Thanks for walking deep into the mountain with me.",
      top: "Back to top",
      navTitle: "Navigation",
      socialTitle: "Find me",
      timeTitle: "Right now in",
      cities: { saoPaulo: "São Paulo", tokyo: "Tokyo" },
      seasonLabel: "Microseason in Japan",
    },
    hero: {
      roles: ['Full-stack developer', 'APIs, integrations & AI'],
      summary: 'I co-built a telecardiology platform that serves 42+ clinics and carries 2,000+ signed medical reports a month.',
      scrollCue: '奥山 means “deep mountain”. Scroll to enter.',
      available: 'Available for',
      ctaProjects: 'See projects',
      ctaContact: 'Get in touch',
      omikuji: {
        open: 'Draw your fortune',
        hint: 'Click the torii to draw your fortune',
        stick: 'Stick no.',
        keep: 'Keep the fortune',
        again: 'Draw again',
        tie: 'Tie it to the branch',
        tieNote: 'At the shrine, whoever draws 凶 ties the paper to a branch and leaves the bad luck behind.',
        close: 'Close',
      }
    },
    about: {
      title: 'About Me',
      lead: 'I started out keeping a supermarket’s checkouts running. Today I build the back end of a medical platform and, in my spare time, paint mountains in shaders.',
      paragraphs: [
        'I am of Japanese descent on both my father’s and my mother’s side, and Japanese culture has always been part of my family: in my grandparents, our customs and the small traditions. 奥山 (Okuyama) means "deep mountain", something that comes from far away, keeps stories and lives on in new generations.',
        'Technology is where I found a way to turn curiosity into concrete things: products that bring together engineering, interaction and design. Beyond code: anime (a few are hidden around here), online games and football.',
        'Today I am a full-stack developer, studying Computer Engineering at FACENS, looking for a team where I can build products end to end.',
      ],
      names: [
        { kanji: '奥山', romaji: 'Okuyama', note: 'father’s family · "deep mountain"' },
        { kanji: '芳賀', romaji: 'Haga', note: 'mother’s family' },
      ],
      btnResume: 'Download CV',
      resumePaint: {
        role: 'Full-Stack Developer',
        sections: ['Experience', 'Projects', 'Education', 'Technologies'],
        status: 'Preparing the CV for download',
      },
      btnContact: 'Get in touch'
    },
    techSection: {
      title: "Technologies & Tools",
      hint: "Like Tanabata wishes, each paper strip is an area. Pick one to see the tools.",
      toolsCount: "tools",
      categories: [
        { name: "Languages", kanji: "言", items: ["TypeScript", "JavaScript", "Python", "SQL"] },
        { name: "Front-end & 3D", kanji: "表", items: ["React", "Next.js", "Tailwind CSS", "Shadcn/ui", "Vite", "GSAP", "Three.js", "React Three Fiber", "Zustand"] },
        { name: "Back-end & Architecture", kanji: "裏", items: ["Node.js", "NestJS", "Express", "Fastify", "Swagger/OpenAPI", "Stripe (Checkout & Webhooks)", "Gemini API (generative AI)", "Multi-tenancy"] },
        { name: "Data", kanji: "蔵", items: ["PostgreSQL", "MySQL", "MongoDB", "Prisma ORM", "Power BI"] },
        { name: "Testing & Security", kanji: "守", items: ["Jest", "Vitest", "Playwright", "Supertest", "Zod", "JWT", "OAuth", "2FA/OTP", "RBAC", "Argon2", "Helmet", "Rate limiting"] },
        { name: "DevOps & Process", kanji: "流", items: ["Docker", "Git", "GitHub Actions (CI/CD)", "Vercel", "ESLint", "Prettier"] }
      ]
    },
    experienceTitle: "Professional Experience",
    experienceLabels: {
      current: "Present",
      parallel: "concurrent",
      education: "Education",
      expected: "Expected graduation",
      viewProject: "See the project",
      tags: "Tools",
    },
    experience: [
      {
        id: 1,
        start: "2022-04",
        end: "2025-02",
        role: "IT Technician & Data Analyst",
        company: "Supermercado Mairinque",
        summary: "IT support and data analysis for the store operations.",
        highlights: [
          { value: "40+", text: "points of sale, self-checkouts, scanners and scales running for 3 years with no critical outages" },
          { text: "Reports and dashboards in Power BI and Excel for management" },
          { text: "Found registration inconsistencies in the VR Software ERP" },
        ],
        tags: ["Power BI", "Excel", "ERP VR Software", "Hardware"],
      },
      {
        id: 2,
        start: "2025-02",
        end: null,
        type: "Internship",
        role: "Software Development & IT Intern",
        company: "Mairinque City Hall",
        summary: "Internal process automation and IT infrastructure administration.",
        highlights: [
          { value: "-70%", text: "time to generate administrative contracts, automated with Python" },
          { value: "-83%", text: "support tickets in GLPI: from over 60 to fewer than 10 per month" },
          { text: "Server, network infrastructure and custom Windows image administration" },
        ],
        tags: ["Python", "GLPI", "Networking", "Windows"],
      },
      {
        id: 3,
        start: "2025-05",
        end: null,
        type: "Freelance",
        role: "Full-Stack Developer",
        company: "IMACARDIOS",
        summary: "Co-built, in a team of two, the full stack of a B2B telecardiology platform in production.",
        highlights: [
          { value: "42+", text: "clinics using the platform across Brazil and Latin America" },
          { value: "2,000+", text: "reports signed per month" },
          { value: "2FA", text: "mandatory for doctors and admins, with sensitive data kept isolated (LGPD)" },
        ],
        tags: ["NestJS", "Prisma", "PostgreSQL", "Next.js", "Swagger", "Jest"],
        link: "/projects/imacardios",
      },
    ],
    education: {
      course: "Computer Engineering",
      institution: "FACENS",
      end: "2026-12",
      summary: "Bachelor's degree at Centro Universitário Facens, in Sorocaba (Brazil).",
    },
    certificatesPage: {
      title: "Certificates & Courses",
      summary: "{certs} certificates · {bootcamps} bootcamps · {formations} program",
      filterLabel: "Filter by area",
      filterAll: "All",
      btnView: "View certificate",
      modules: "modules",
      degreeTitle: "Education",
      degreeExpected: "Expected",
      degreeDone: "Completed",
      viewer: { close: "Close", prev: "Previous certificate", next: "Next certificate", issued: "issued", image: "Certificate" },
      areas: { full: "Bootcamps & Programs", front: "Front-end", back: "Back-end & Data", base: "Fundamentals" },
    },
    // Agrupados por área; trilhas juntam módulos do mesmo curso (cada módulo tem o seu certificado)
    certificates: [
      { id: 1, area: "full", icon: "award", name: "Bootcamp: AI Workout Management", institution: "Full Stack Club", date: "2026-03-11", hours: 10, image: { src: "/certificates/bootcamp-fit-ai.webp", width: 1600, height: 898 }, kind: "bootcamp" },
      { id: 2, area: "full", icon: "award", name: "Self Checkout Bootcamp", institution: "Full Stack Club", date: "2026-03-27", hours: 18, image: { src: "/certificates/bootcamp-self-checkout.webp", width: 1600, height: 898 }, kind: "bootcamp" },
      { id: 3, area: "full", icon: "award", name: "Fullstack JavaScript Program", institution: "OneBitCode", date: "2025-10-07", hours: 200, image: { src: "/certificates/formacao-fullstack-javascript.webp", width: 1600, height: 1132 }, kind: "formation" },
      { id: 4, area: "front", icon: "react", name: "Netflix-Inspired E-Learning Project", institution: "OneBitCode", date: "2025-10-07", hours: 56, image: { src: "/certificates/projeto-ead-netflix.webp", width: 1600, height: 1132 } },
      { id: 5, area: "front", icon: "next.js", name: "NextJS Course", institution: "OneBitCode", date: "2025-08-15", hours: 14, image: { src: "/certificates/nextjs.webp", width: 1600, height: 1132 } },
      { id: 10, area: "front", icon: "react", name: "React Course", institution: "OneBitCode", date: "2025-07-01", hours: 22, image: { src: "/certificates/react.webp", width: 1600, height: 1132 } },
      { id: 11, area: "front", icon: "css3", name: "Modern CSS", institution: "OneBitCode", date: "2025-06-04", hours: 18, image: { src: "/certificates/css-moderno.webp", width: 1600, height: 1132 } },
      { id: 12, area: "front", icon: "bootstrap", name: "Bootstrap and SASS", institution: "OneBitCode", date: "2025-06-18", hours: 10, image: { src: "/certificates/bootstrap-sass.webp", width: 1600, height: 1132 } },
      { id: 22, area: "front", icon: "html5", name: "HTML5 Course", institution: "OneBitCode", date: "2024-12-02", hours: 12, image: { src: "/certificates/html5.webp", width: 1600, height: 1132 } },
      { id: 21, area: "front", icon: "css3", name: "CSS3 Course", institution: "OneBitCode", date: "2024-12-02", hours: 14, image: { src: "/certificates/css3.webp", width: 1600, height: 1132 } },
      { id: 6, area: "back", icon: "prisma", name: "SQL in NodeJS and Prisma ORM", institution: "OneBitCode", date: "2025-08-03", hours: 30, image: { src: "/certificates/sql-nodejs-prisma.webp", width: 1600, height: 1132 } },
      { id: 23, area: "back", icon: "node.js", name: "NodeJS Track", institution: "OneBitCode", modules: [{ label: "NodeJS Course", date: "2025-07-12", hours: 10, image: { src: "/certificates/nodejs-introducao.webp", width: 1600, height: 1132 } }, { label: "NodeJS in Web Applications", date: "2025-07-21", hours: 30, image: { src: "/certificates/nodejs-aplicacoes-web.webp", width: 1600, height: 1132 } }] },
      { id: 9, area: "back", icon: "postgresql", name: "SQL Database Course", institution: "OneBitCode", date: "2025-07-24", hours: 22, image: { src: "/certificates/banco-de-dados-sql.webp", width: 1600, height: 1132 } },
      { id: 24, area: "base", icon: "javascript", name: "JavaScript Track", institution: "OneBitCode", modules: [{ label: "I", date: "2024-11-27", hours: 8, image: { src: "/certificates/javascript-1.webp", width: 1600, height: 1131 } }, { label: "II", date: "2024-12-17", hours: 12, image: { src: "/certificates/javascript-2.webp", width: 1600, height: 1132 } }, { label: "III", date: "2025-03-26", hours: 12, image: { src: "/certificates/javascript-3.webp", width: 1600, height: 1132 } }, { label: "IV", date: "2025-04-08", hours: 14, image: { src: "/certificates/javascript-4.webp", width: 1600, height: 1132 } }, { label: "V", date: "2025-04-16", hours: 12, image: { src: "/certificates/javascript-5.webp", width: 1600, height: 1132 } }, { label: "VI", date: "2025-05-02", hours: 12, image: { src: "/certificates/javascript-6.webp", width: 1600, height: 1132 } }] },
      { id: 14, area: "base", icon: "typescript", name: "TypeScript Course", institution: "OneBitCode", date: "2025-05-07", hours: 10, image: { src: "/certificates/typescript.webp", width: 1600, height: 1132 } },
      { id: 13, area: "base", icon: "git", name: "Git and GitHub", institution: "OneBitCode", date: "2025-05-18", hours: 12, image: { src: "/certificates/git-github.webp", width: 1600, height: 1132 } },
    ],
    projectsPage: { 
      title: "Projects", 
      hint: "Scroll to unroll the emakimono. Each panel is a project.",
      hintDrag: "Drag the emakimono sideways. Each panel is a project.",
      btnAll: "See all projects",
      allTitle: "All {n} projects",
      allDesc: "Landing pages, APIs, apps and study projects, with filters by type.",
      subtitle: "From a product in production to study projects. To see every repository,",
      githubLink: "visit my GitHub profile",
      count: "{n} projects",
      filterLabel: "Filter by type",
      filterAll: "All",
      types: { fullstack: "Full-stack", front: "Front-end", back: "Back-end & APIs", desktop: "Desktop" },
      featuredLabel: "In production",
      bootcampLabel: "Bootcamp",
      cursorOpen: "Open",
      btnMaking: "Behind the scenes",
      caseTitle: "The case",
      caseChallenge: "Challenge",
      caseDecisions: "What I decided",
      caseResult: "Result",
      featuredStats: [
        { value: "42+", label: "clinics across Brazil and Latin America" },
        { value: "2,000+", label: "reports signed per month" },
      ],
      groups: {
        "fit-ai": { title: "FIT.AI: Workout Platform", desc: "Mobile-first app with a real-time AI coach and its own API behind it." },
        devflix: { title: "DevFlix: E-Learning Platform", desc: "Netflix-inspired course platform, with a front end and a streaming API." },
      },
      partsLabel: "Project parts",
      btnDetails: "View Details",
      btnCode: "View on GitHub",
      btnDeploy: "Visit site",
      techs: "Technologies",
      features: "What It Does",
      aboutProject: "About the Project",
      projectImage: "Project Image",
      loadingText: "Loading project...",
      btnBack: "Back",
      projectLabel: "Project",
      gallery: "Gallery",
      galleryPrev: "Previous photo",
      galleryNext: "Next photo",
      galleryGoTo: "Go to photo {n}",
      prevProject: "Previous project",
      nextProject: "Next project",
      overview: "Overview",
      status: "Status",
      statusLive: "Live",
      statusCode: "Open source",
      techCount: "Technologies",
      featureCount: "Features",
      role: "Role",
      context: "Context",
      period: "Period",
      periodNow: "present",
      apiTitle: "API routes",
      apiAuth: "requires login",
      scrollCue: "Scroll to read"
    },
    easterEgg: { message: "千羽鶴: a thousand paper cranes wishing you good luck!" },
    projects: [
      {
        id: 11, slug: 'imacardios', type: 'fullstack', featured: true, title: 'IMACARDIOS: Telemedicine & Remote Reports',
        role: "Full-stack, in a pair", context: "Paid freelance", period: {start: "2025-05",end: null},
        stack: ['Next.js', 'React', 'NestJS', 'TypeScript', 'Prisma', 'PostgreSQL', 'Swagger', 'Jest', 'Playwright', 'Supertest'],
        shortDesc: 'B2B telecardiology platform in production: 42+ clinics and 2,000+ reports per month.',
        longDesc: 'Paid freelance project, built in a team of two. IMACARDIOS is a B2B telecardiology platform in production, serving healthcare networks in Brazil and Latin America, now with 42+ clinics and 2,000+ signed reports per month.\n\nI designed the isolation of sensitive data (CPF and diagnosis kept outside the main database) and tenant isolation between clinics in two layers: in the application and in Postgres rules. The NestJS + Prisma/PostgreSQL back end is documented with Swagger and covered by tests.',
        features: ['Multi-tenant platform with two-layer clinic isolation', 'Sensitive data (CPF and diagnosis) kept outside the main database', 'Mandatory 2FA for doctors and admins (LGPD)', 'NestJS + Prisma/PostgreSQL back end', 'API documented with Swagger/OpenAPI', 'Tests with Jest, Playwright and Supertest', 'In production across Brazil and Latin America'],
        repoLink: null, deployLink: 'https://app.imacardios.com',
        caseStudy: {
          challenge: 'Cardiology reports from dozens of clinics on the same platform, with health data protected by Brazil’s LGPD: a clinic must never see another clinic’s patients.',
          decisions: [
            'Two-layer clinic isolation: the API ties every query to the requesting clinic, and Postgres rules enforce the same lock inside the database.',
            'CPF and diagnosis stored outside the main database: a leak there doesn’t expose the most sensitive data.',
            'Mandatory 2FA for doctors and admins.',
            'NestJS + Prisma API documented in Swagger and covered by tests (Jest, Supertest and Playwright).',
          ],
          result: 'In production across Brazil and Latin America: 42+ clinics and 2,000+ signed reports a month.',
          diagram: {
            alt: 'Diagram: clinics go through the API, which isolates data per clinic, and through PostgreSQL, which repeats the isolation in its rules; CPF and diagnosis live in a separate database.',
            clinic: 'Clinic',
            app: 'NestJS API · layer 1: every query tied to its clinic',
            db: 'PostgreSQL · layer 2: per-clinic rules',
            vault: 'CPF and diagnosis apart',
            caption: 'Two independent locks between clinics, and the most sensitive data outside the main database.',
          },
        },
        images: [], imageMobile: false, image: null
      },
      {
        id: 12, slug: 'saeko-artes', type: 'front', title: 'Saeko Artes: Amigurumi Catalog',
        role: "Front-end", context: "Real client", period: {start: "2026-04",end: "2026-04"},
        caseStudy: {challenge: "A crochet studio needed to sell its pieces online without running an online store: no checkout, sign-up or database to maintain, but with real shipping rates from the Brazilian postal service calculated on the spot.",decisions: ["Orders end on WhatsApp, where the studio already talks to customers: the message arrives with the pieces, quantities, shipping, postal code and total already filled in.","Real shipping quotes from the Melhor Envio API inside a Server Action: the token stays on the server and the browser only gets the cheapest option between PAC and SEDEX, with the delivery time.","Server Components by default; the 3D model in the hero arrives after the text (dynamic import, no SSR) and does not weigh on the first load.","Each of the 28 pieces has its own static page with metadata and Open Graph: a shared link already shows the photo of the piece."],result: "A live catalog with all 28 pieces, shipping calculated on the spot and orders arriving ready on WhatsApp, with no database or admin panel to maintain."},
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'React Three Fiber', 'Zustand', 'Framer Motion', 'Lenis'],
        shortDesc: 'Catalog for a crochet studio with real shipping quotes and ordering through WhatsApp.',
        longDesc: 'Landing page and digital catalog for Saeko Artes, a handmade amigurumi studio from Mairinque (Brazil). Pieces are shown in a minimalist editorial gallery, real Brazilian postal shipping is quoted through the Melhor Envio API, and orders are completed on WhatsApp, with no checkout, sign-up or database.\n\nServer Components by default, with "use client" only where there is interaction: the cart, the animations and the 3D model in the hero. Each of the 28 pieces has its own static page, with metadata and Open Graph.',
        features: ['3D amigurumi model in the hero with React Three Fiber, loaded without hurting LCP', 'Real shipping quotes from the Melhor Envio API in a Server Action: the token never reaches the browser', 'Drawer cart with Zustand and a live subtotal', 'Order automatically written into the WhatsApp message', '28 static product pages with metadata and Open Graph', 'Dynamically generated sitemap and robots'],
        repoLink: 'https://github.com/RaphaelOkuyama/catalago-amigurumis', deployLink: 'https://catalago-amigurumis.vercel.app',
        images: imagesIn([...SAEKO_SITE, ...SAEKO_SHOTS], 'en'), imageMobile: false, imageProducts: true, image: null
      },
      {
        id: 1, slug: 'fit-ai-frontend', origin: 'bootcamp', type: 'front', group: 'fit-ai', part: 'App', title: 'FIT.AI: Workout App',
        role: "Front-end", context: "Full Stack Club bootcamp", period: {start: "2026-03",end: "2026-03"},
        caseStudy: {challenge: "Building a workout plan requires knowing a person’s weight, height, goals and routine, and a long form drives away exactly the people who are just starting.",decisions: ["Sign-up is a conversation: the AI coach (Gemini 2.5 Flash) collects the data and, at the end, builds the weekly plan.","Streaming answers, word by word, through the AI SDK: the conversation never feels stuck.","An end-to-end typed contract: the Fastify API routes are validated with Zod, the OpenAPI spec comes from them and Orval generates the front-end client. A change in the API breaks the build, not the user.","Server Components to fetch data and Server Actions for mutations; JavaScript in the browser only where there is interaction."],result: "From the first login to a workout plan in a single conversation, with the app and the API speaking the same typed contract."},
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Google Gemini', 'Better Auth', 'Orval'],
        shortDesc: 'Mobile-first workout app with real-time AI coach.',
        longDesc: 'Full Stack Club bootcamp project. FIT.AI is a mobile-first workout management app with an integrated virtual personal trainer. Built with Next.js 16 and React 19, the app features a conversational AI onboarding (Google Gemini 2.5 Flash), where the coach collects your physical data and builds a personalized workout plan.',
        features: ['Real-time AI coach chat', 'Intelligent conversational onboarding', 'Dashboard with streak and statistics', 'AI-generated personalized weekly workout plan', 'Server Components + Server Actions', 'Google OAuth authentication'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-frontend', deployLink: 'https://gestao-de-treino-frontend.onrender.com',
        images: imagesIn(FIT_AI_SHOTS, 'en'), imageMobile: true, image: null
      },
      {
        id: 2, slug: 'fit-ai-api', origin: 'bootcamp', type: 'back', group: 'fit-ai', part: 'API', title: 'FIT.AI: API',
        role: "Back-end", context: "Full Stack Club bootcamp", period: {start: "2026-03",end: "2026-03"},
        stack: ['Node.js', 'TypeScript', 'Fastify', 'Prisma', 'PostgreSQL', 'Google Gemini', 'Better Auth', 'Docker', 'Swagger/OpenAPI'],
        shortDesc: 'The FIT.AI API: workouts, progress and the AI coach with streamed replies.',
        longDesc: 'Full Stack Club bootcamp project. Back end of the FIT.AI platform. The API manages users, workout plans, exercises, sessions and progress statistics. The core feature is the integration with Google Gemini for generating personalized workout plans and streaming virtual coach responses.',
        features: ['Google Gemini integration for workout generation', 'Streaming coach responses via SSE', 'Automatic documentation with Swagger/OpenAPI', 'Google OAuth authentication', 'Containerized with Docker', 'Layered architecture with Fastify', 'Prisma ORM with PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-api', deployLink: 'https://gestao-de-treino-api.onrender.com',
        images: imagesIn(FIT_AI_API_SHOTS, 'en'), imageMobile: false, image: null
      },
      {
        id: 3, slug: 'totem-autoatendimento', origin: 'bootcamp', type: 'fullstack', title: 'Self-Service Kiosk',
        role: "Full-stack", context: "Full Stack Club bootcamp", period: {start: "2026-02",end: "2026-03"},
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Prisma', 'PostgreSQL', 'Stripe'],
        shortDesc: 'Self-service ordering for a touchscreen kiosk, from menu to Stripe payment.',
        longDesc: 'Full Stack Club bootcamp project. A self-service system built to run on a physical touchscreen kiosk. The flow covers everything from order type selection to Stripe payment processing, through a dynamic menu with categories, product details and bag management.',
        features: ['Interface optimized for touchscreen', 'Dynamic menu with categories', 'Bag with quantity control and total', 'Stripe Checkout payment integration', 'Real-time payment confirmation screen', 'Order history lookup by CPF', 'Database with Prisma + PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/totem-autoatendimento', deployLink: 'https://totem-autoatendimento.vercel.app',
        images: imagesIn(TOTEM_SHOTS, 'en'), imageMobile: true, image: null
      },
      {
        id: 13, slug: 'arca-construtora', type: 'front', title: 'ARCA: Construction Company Landing Page',
        role: "Front-end", context: "Concept project", period: {start: "2026-04",end: "2026-04"},
        caseStudy: {challenge: "A high-end construction company sells sophistication: the page needed the presence of an architecture portfolio, with video, animation and depth, without getting heavy on phones.",decisions: ["The building rises as you scroll: 63 frames drawn on a canvas and tied to the scroll, which only start downloading when the section gets close to the screen.","The weight adapts to the device: phones get 1 in every 3 frames (about 21 images) and the hero video is a native video that only downloads when it plays; on desktop, the drone video is drawn on a canvas with corrected framing.","Project cards with real depth: two layers (the background and the cut-out of the building) and a light glare that follows the tilt of the mouse.","A 100% static page made of thirteen independent blocks, from the preloader to the footer."],result: "A landing page that behaves like an architecture portfolio and sends only a third of the animation frames to visitors on phones."},
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Canvas API'],
        shortDesc: 'High-end landing page with canvas animations and scroll-driven storytelling.',
        longDesc: 'Institutional landing page (concept project) for a high-end construction company. The focus is the visual layer: canvas animations, scroll-driven storytelling and micro-interactions that convey the sophistication of an architecture portfolio.\n\nA single, fully static page made of thirteen independent blocks, from the preloader to the footer.',
        features: ['Preloader with a building rising floor by floor and canvas particles', 'Drone video in the hero drawn on canvas on desktop, with a light native video on mobile', '63-frame construction sequence synced to scroll, loaded on demand', 'Project cards with 3D parallax and a light glare following the mouse', 'Animated counters, testimonial carousel and FAQ accordion'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-construtoras', deployLink: 'https://landing-page-exemple-construtoras.vercel.app',
        images: imagesIn(ARCA_SHOTS, 'en'), imageMobile: false, image: null
      },
      {
        id: 14, slug: 'glow-laser', type: 'front', title: 'GLOW LASER: Clinic Landing Page',
        role: "Front-end", context: "Concept project", period: {start: "2026-04",end: "2026-04"},
        caseStudy: {challenge: "Beauty clinics compete for attention on phones: the page had to create desire and, above all, turn the visit into a WhatsApp conversation.",decisions: ["Two lead-capture tools: a 4-question quiz that suggests a protocol and number of sessions, and an investment calculator in reais. Both end on WhatsApp with the result.","A draggable before-and-after slider (mouse and touch) that updates the clip-path directly, frame by frame, without React re-renders; until the first touch, it demonstrates itself.","A hero video with a plan B: if the mobile browser blocks autoplay, the video starts on the first tap on the screen.","Server Components by default; only the interactive parts (scroll, drag, quiz and calculator) run in the browser."],result: "Every path on the page leads to WhatsApp, and visitors arrive there already knowing the suggested protocol, sessions and estimated investment."},
        stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS v4'],
        shortDesc: 'Landing page with a diagnosis quiz and an investment calculator that lead to WhatsApp.',
        longDesc: 'Landing page (concept project) for aesthetics and laser hair removal clinics, with an editorial identity and two lead capture tools: a diagnosis quiz and an investment calculator. Every path leads to WhatsApp.\n\nServer Components by default and "use client" only in the interactive parts.',
        features: ['Before and after slider with a draggable divider (mouse and touch), without React re-renders', '4-question quiz that suggests a protocol and number of sessions', 'Live investment calculator in Brazilian reais', 'Video hero with a fallback for blocked autoplay on mobile', 'Header with a reading progress bar and active section highlight'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-clinicas', deployLink: 'https://landing-page-exemple-clinicas.vercel.app',
        images: imagesIn(GLOW_SHOTS, 'en'), imageMobile: false, image: null
      },
      {
        id: 15, slug: 'portfolio-okuyama', type: 'front', title: 'This Portfolio: the Okuyama Mountain',
        role: "Design, 3D & code", context: "Personal project", period: {start: "2025-12",end: null},
        stack: ['Next.js 16', 'React 19', 'Three.js', 'React Three Fiber', 'GSAP', 'Zustand', 'Lenis', 'Playwright'],
        shortDesc: 'Immersive 3D portfolio: a walk deep into the mountain through the four seasons.',
        longDesc: 'This site. An immersive portfolio where scrolling the page takes you deep into the mountain (奥山, "deep mountain"): the 3D scene goes through the four seasons, from sakura to snow, with a torii, a zen garden and a river of lanterns at the end.\n\nThree.js scene with React Three Fiber and custom shaders, GSAP animations, and unit (Vitest) and e2e (Playwright) tests covering every section.',
        features: ['3D scene with seasons, fog, forest, zen garden and river drawn with custom shaders', 'Projects on an emakimono scroll that unrolls horizontally', 'Contact form that turns into a lantern floating down the river', 'Per-project share images and Person structured data', 'Painted SVG backdrop for browsers without WebGL', 'Unit and e2e tests for every section'],
        repoLink: 'https://github.com/RaphaelOkuyama/portfolio', deployLink: 'https://portfolio-raphael-okuyama.vercel.app',
        images: imagesIn(PORTFOLIO_SHOTS, 'en'), imageMobile: false, image: null
      },
      { 
        id: 4, slug: 'devflix-frontend', type: 'front', group: 'devflix', part: 'Front-end', title: 'DevFlix Frontend', 
        role: "Front-end", context: "OneBitCode course", period: {start: "2025-08",end: "2025-09"},
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'Front end of a Netflix-inspired course platform.',
        longDesc: 'Front end of DevFlix, an online course platform with Netflix-style browsing: rows by category, episodes and progress for each lesson. It talks to the DevFlix API with Axios and SWR.',
        features: ['Responsive, mobile-first interface', 'Server-side rendered pages (SSR)', 'API data with Axios and SWR caching', 'Sass module styles'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 5, slug: 'devflix-backend', type: 'back', group: 'devflix', part: 'API', title: 'DevFlix API', 
        role: "Back-end", context: "OneBitCode course", period: {start: "2025-08",end: "2025-09"},
        endpoints: [{method: "POST",path: "/auth/register"},{method: "POST",path: "/auth/login"},{method: "GET",path: "/courses/featured",auth: true},{method: "GET",path: "/courses/search",auth: true},{method: "GET",path: "/episodes/stream",auth: true},{method: "POST",path: "/episodes/:id/watchTime",auth: true},{method: "POST",path: "/favorites",auth: true},{method: "GET",path: "/users/current/watching",auth: true}],
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT'], 
        shortDesc: 'DevFlix API: courses, episodes, favorites and JWT login.',
        longDesc: 'DevFlix REST API in Express, Sequelize and PostgreSQL. It stores the catalog of courses and episodes, favorites and each student’s progress, with JWT login and an AdminJS admin panel.',
        features: ['JWT login', 'Categories, courses, episodes and favorites', 'Per-student watch progress', 'AdminJS admin panel', 'Relational model with Sequelize and PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 6, slug: 'player-electron', type: 'desktop', title: 'Music Player Desktop', 
        role: "Desktop", context: "Study project", period: {start: "2025-09",end: "2025-10"},
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'Electron desktop music player for local files.',
        longDesc: 'Cross-platform desktop app built with Electron and React. It reads music straight from the computer, builds playlists and controls playback, things a web page cannot do on its own.',
        features: ['Import music from the computer', 'Play, pause and next track', 'Playlist creation', 'File system access through Electron'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 7, slug: 'react-kanban', type: 'front', title: 'React Kanban', 
        role: "Front-end", context: "Study project", period: {start: "2025-09",end: "2025-09"},
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Kanban board where tasks move from column to column, with priorities.',
        longDesc: 'Kanban board in React and TypeScript: tasks are created in an accessible Radix UI dialog, validated with Zod, and move from To do to In progress and Done. The data lives in a mock REST API served by json-server.',
        features: ['Tasks that move between columns (To do, In progress, Done)', 'Create and delete tasks, with priorities (json-server)', 'Form validation with Zod', 'Accessible Radix UI components'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban', deployLink: null, images: imagesIn(KANBAN_SHOTS, 'en'), imageMobile: false, image: null
      },
      { 
        id: 8, slug: 'api-leadmagnet', type: 'back', title: 'API Lead Magnet', 
        role: "Back-end", context: "OneBitCode course", period: {start: "2025-09",end: "2025-09"},
        endpoints: [{method: "GET",path: "/api/leads"},{method: "POST",path: "/api/leads"},{method: "PUT",path: "/api/leads/:id"},{method: "POST",path: "/api/groups/:groupId/leads"},{method: "POST",path: "/api/campaigns"},{method: "PUT",path: "/api/campaigns/:campaignId/leads/:leadId"},{method: "GET",path: "/api/status"}],
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'REST API to organize leads into groups and campaigns.',
        longDesc: 'REST API in Express and TypeScript that stores leads and organizes them into groups and campaigns. Every request is validated with Zod and the data lives in PostgreSQL through Prisma.',
        features: ['Create and query leads', 'Leads organized into groups and campaigns', 'Request validation with Zod', 'Prisma with PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 9, slug: 'api-library', type: 'back', title: 'Library Auth API', 
        role: "Back-end", context: "OneBitCode course", period: {start: "2025-09",end: "2025-09"},
        endpoints: [{method: "POST",path: "/auth/register"},{method: "POST",path: "/auth/login"},{method: "GET",path: "/api/books"},{method: "POST",path: "/api/books"},{method: "PUT",path: "/api/books/:id"},{method: "POST",path: "/api/loans",auth: true},{method: "POST",path: "/api/loans/:id/return"}],
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'Library API with JWT login and hashed passwords.',
        longDesc: 'Simulates a library back end: books, users and loans. Passwords are stored as Bcrypt hashes, never in plain text, and sensitive routes only respond to a valid JWT.',
        features: ['Bcrypt password hashing', 'JWT-protected routes', 'Loan management', 'Unique IDs with UUID'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 10, slug: 'star-wars-catalog', type: 'front', title: 'Star Wars Catalog', 
        role: "Front-end", context: "Study project", period: {start: "2025-08",end: "2025-08"},
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Star Wars starship catalog with SWAPI data.',
        longDesc: 'Next.js catalog that fetches starships from the public Star Wars API (SWAPI) and builds a detail page for each one with dynamic routes.',
        features: ['Data from the public SWAPI', 'Asynchronous data loading', 'Category navigation', 'Detail page with a dynamic route'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog', deployLink: 'https://star-wars-spaceships-catalog.vercel.app', images: imagesIn(STAR_WARS_SHOTS, 'en'), imageMobile: false, image: null
      },
    ],
    contactPage: {
      title: "Let’s Talk",
      subtitle: "Tell me about the role, the project or the idea. I will reply to the email you leave.",
      availabilityLabel: "Available for",
      availability: ["Full-time (CLT)", "Contractor (PJ)", "Freelance"],
      location: "São Paulo, Brazil",
      channels: "Or reach me directly",
      copyEmail: "Copy email",
      copied: "Email copied!",
      letter: "手紙",
      lanternHint: "When you send it, your message floats down the river in a lantern.",
      meishi: {
        open: "Take my card",
        title: "Business card",
        note: "In Japan, a meishi is handed over with both hands, facing the person receiving it. Point your camera at the QR on the back to save my contact.",
        flip: "Flip card",
        save: "Save contact",
        close: "Close",
        qr: "QR code with my contact",
      },
      form: {
        nameLabel: "Name", namePlaceholder: "What should I call you?",
        emailLabel: "Email", emailPlaceholder: "you@email.com",
        messageLabel: "Message", messagePlaceholder: "Tell me about the role, the project or the idea...",
        btn: "Send Message",
      },
      errors: {
        name: { required: "Tell me what to call you.", too_long: "Name is too long." },
        email: { required: "Add your email so I can reply.", invalid: "That email does not look valid." },
        message: { required: "Write your message.", too_long: "Message is too long." },
      },
      sent: {
        title: "Your lantern is on the river, {name}.",
        text: "I got your message and will reply to the email you left.",
        again: "Send another message",
      },
      sending: "Sending...",
      toast: {
        loading: "Sending message...",
        success: "Message sent! It floats down the river in a lantern.",
        error: "Couldn’t send it right now. Try again or email raphaelokuyama123@gmail.com.",
        network: "Connection error. Check your network.",
        rate: "Too many messages in a short time. Please try again in a few minutes.",
        unavailable: "Sending is down right now. Please email raphaelokuyama123@gmail.com directly."
      }
    }
  }
};

// Ordem dos projetos em todo o site: primeiro o que está em produção e os projetos originais,
// depois os de bootcamp e os estudos. Os seis primeiros formam o rolo da home (lib/projects.js),
// então os numerais do rolo são sequenciais e iguais aos das páginas de projeto
export const PROJECT_ORDER = [
  'imacardios', 'saeko-artes', 'arca-construtora', 'fit-ai-frontend', 'totem-autoatendimento', 'portfolio-okuyama',
  'glow-laser', 'fit-ai-api',
];
const rank = (slug) => {
  const i = PROJECT_ORDER.indexOf(slug);
  return i < 0 ? PROJECT_ORDER.length : i;
};
for (const lang of ['pt', 'en']) resumeData[lang].projects.sort((a, b) => rank(a.slug) - rank(b.slug));
