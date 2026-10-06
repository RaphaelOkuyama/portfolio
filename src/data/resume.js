// ============================================================
// NOTAS SOBRE AS IMAGENS DO TOTEM:
// /public/projects/totem/tela-01.png
// ============================================================

const TOTEM_IMGS = [
  { src: '/projects/totem/tela-01.png', alt: 'Tela de boas-vindas' },
  { src: '/projects/totem/tela-02.png', alt: 'Cardápio de combos' },
  { src: '/projects/totem/tela-03.png', alt: 'Detalhes do produto' },
];

// Nome em latim e em japonês (kanji, katakana e hiragana); o hero cicla katakana ↔ hiragana
export const profile = {
  name: 'Raphael Nobuyuki Haga Okuyama',
  nameKanji: 'ラファエル 信幸 芳賀 奥山',
  nameKatakana: 'ラファエル ノブユキ ハガ オクヤマ',
  nameHiragana: 'らふぁえる のぶゆき はが おくやま',
};

export const resumeData = {
  pt: {
    nav: { home: "Home", projects: "Projetos", certificates: "Certificados", contact: "Contato" },
    footer: {
      rights: "Todos os direitos reservados.",
      lead: "Obrigado por adentrar a montanha comigo.",
      top: "Voltar ao topo",
      navTitle: "Navegação",
      socialTitle: "Onde me achar",
      timeTitle: "Agora em",
      cities: { saoPaulo: "São Paulo", tokyo: "Tóquio" },
      seasonLabel: "Microestação no Japão",
    },
    hero: {
      roles: ['Desenvolvedor Full-Stack', 'APIs & Arquitetura Limpa', 'Integrações & IA'],
      summary: 'Desenvolvo sistemas que rodam de verdade: meu código atende 42+ clínicas e assina 2.000+ laudos por mês.',
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
      lead: 'Minha história começa muito antes do código.',
      paragraphs: [
        'Sou descendente de japoneses por parte de pai e de mãe, e a cultura japonesa sempre esteve presente na minha família: nos meus avós, nos costumes e nas pequenas tradições. 奥山 (Okuyama) significa "montanha profunda", algo que vem de longe, guarda histórias e segue existindo nas novas gerações.',
        'Na tecnologia encontrei um jeito de transformar curiosidade em coisas concretas: produtos que unem engenharia, interação e design. Fora do código, gosto de xadrez e de experimentar novas ideias.',
        'Hoje sou desenvolvedor full-stack, estudo Engenharia de Computação na FACENS e procuro um time onde eu possa construir produto de ponta a ponta.',
      ],
      // Os dois sobrenomes: o do pai (Okuyama) e o da mãe (Haga)
      names: [
        { kanji: '奥山', romaji: 'Okuyama', note: 'família do pai · "montanha profunda"' },
        { kanji: '芳賀', romaji: 'Haga', note: 'família da mãe' },
      ],
      btnResume: 'Baixar currículo',
      btnContact: 'Fale comigo'
    },
    techSection: {
      title: "Tecnologias & Ferramentas",
      hint: "Cada galho do bonsai é uma área e cada folha, uma ferramenta. Escolha um galho para ver o que tem nele.",
      toolsCount: "ferramentas",
      // kanji: 言 palavra · 表 a face · 裏 o avesso · 蔵 o depósito · 守 proteger · 流 o fluxo
      categories: [
        { name: "Linguagens", kanji: "言", items: ["TypeScript", "JavaScript", "Python", "SQL", "GLSL"] },
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
      areas: { full: "Bootcamps & Formações", front: "Front-end", back: "Back-end & Dados", base: "Fundamentos" },
    },
    // Agrupados por área; trilhas juntam módulos do mesmo curso (cada módulo tem o seu certificado)
    certificates: [
      { id: 1, area: "full", icon: "award", name: "Bootcamp: Gestão de Treinos com IA", institution: "Full Stack Club", link: "https://drive.google.com/file/d/1J4_pW5k-evrK_8dXGEmkQQbfwGxRMTEU/view?usp=sharing", kind: "bootcamp" },
      { id: 2, area: "full", icon: "award", name: "Bootcamp Self Checkout", institution: "Full Stack Club", link: "https://drive.google.com/file/d/1P_JxOakam_Lco3Tv2MNo66Vv5jGSCI-C/view?usp=sharing", kind: "bootcamp" },
      { id: 3, area: "full", icon: "award", name: "Formação Fullstack JavaScript", institution: "OneBitCode", link: "https://drive.google.com/file/d/1gluZITKLl67R8j4oVN8QurlOF9EzMZXY/view?usp=sharing", kind: "formation" },
      { id: 4, area: "front", icon: "react", name: "Projeto EAD Inspirado no Netflix", institution: "OneBitCode", link: "https://drive.google.com/file/d/1qGPGox8LHMQvd20dD4pstXmW2VPXht_y/view?usp=sharing" },
      { id: 5, area: "front", icon: "next.js", name: "Curso de NextJS", institution: "OneBitCode", link: "https://drive.google.com/file/d/1I7Jr9McP_IQKRmEDMO2j2A3WGVGGT77e/view?usp=sharing" },
      { id: 10, area: "front", icon: "react", name: "Curso de React", institution: "OneBitCode", link: "https://drive.google.com/file/d/143jdZvzdgUTiT0R6_V_ZCymxu0Is5Vpt/view?usp=sharing" },
      { id: 11, area: "front", icon: "css3", name: "CSS Moderno", institution: "OneBitCode", link: "https://drive.google.com/file/d/1Q6N1BaPZFOH0ECOJie2FTGjGQDOLCUNA/view?usp=sharing" },
      { id: 12, area: "front", icon: "bootstrap", name: "Bootstrap e SASS", institution: "OneBitCode", link: "https://drive.google.com/file/d/1_PgBGaWfj5Eqh9I80gETuPDQUgF1C5Ri/view?usp=sharing" },
      { id: 22, area: "front", icon: "html5", name: "Curso de HTML5", institution: "OneBitCode", link: "https://drive.google.com/file/d/1hCZmPBx-J6WAThP4KQ9ITreUmMPJDbdQ/view?usp=sharing" },
      { id: 21, area: "front", icon: "css3", name: "Curso de CSS3", institution: "OneBitCode", link: "https://drive.google.com/file/d/1V-AgaPuW-leQy-qSWsBmzcXM3DC7oMht/view?usp=sharing" },
      { id: 6, area: "back", icon: "prisma", name: "SQL no NodeJS e Prisma ORM", institution: "OneBitCode", link: "https://drive.google.com/file/d/1X9EpEiLNA7LZc08FDdAZXLUlyt4jxBl7/view?usp=sharing" },
      { id: 23, area: "back", icon: "node.js", name: "Trilha NodeJS", institution: "OneBitCode", modules: [{ label: "Curso de NodeJS", link: "https://drive.google.com/file/d/1jMbrhElEAFEOHY5ph5wtRQOCDQSz74mE/view?usp=sharing" }, { label: "NodeJS em Aplicações Web", link: "https://drive.google.com/file/d/1YBDj_Hz9bAF7C5Z9ZYs8T3DeVdFNsWi2/view?usp=sharing" }] },
      { id: 9, area: "back", icon: "postgresql", name: "Curso de Banco de Dados SQL", institution: "OneBitCode", link: "https://drive.google.com/file/d/1Wob8BdSy3bIvIGk_is74AgBpmS9hNsew/view?usp=sharing" },
      { id: 24, area: "base", icon: "javascript", name: "Trilha JavaScript", institution: "OneBitCode", modules: [{ label: "I", link: "https://drive.google.com/file/d/1J3Pdmk_8pK1hA7Cd4devshM-shOnq-6w/view?usp=sharing" }, { label: "II", link: "https://drive.google.com/file/d/1Z5Jhrd9rvUtMd7tCh-VC1TYonAwHzeLC/view?usp=sharing" }, { label: "III", link: "https://drive.google.com/file/d/1l6zWN9JktClgEZkRvMaK_36A4U9mxu0A/view?usp=sharing" }, { label: "IV", link: "https://drive.google.com/file/d/1pbuD3XndCasiNHj19GhzltGbI3P7pUoN/view?usp=sharing" }, { label: "V", link: "https://drive.google.com/file/d/1fgRLJXx3DUgjQTHKmV4X17mtBmr90RhV/view?usp=sharing" }, { label: "VI", link: "https://drive.google.com/file/d/1V0vWxi38c02czMZz9MdrYeQfmySThWgq/view?usp=sharing" }] },
      { id: 14, area: "base", icon: "typescript", name: "Curso de TypeScript", institution: "OneBitCode", link: "https://drive.google.com/file/d/149wMZ6nlMpb_ZZSry_ghUJFeCUi7Gblf/view?usp=sharing" },
      { id: 13, area: "base", icon: "git", name: "Git e GitHub", institution: "OneBitCode", link: "https://drive.google.com/file/d/16SjZpNj47YW_ceOeEWhM81rBJyYWd5Vt/view?usp=sharing" },
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
      prevProject: "Projeto anterior",
      nextProject: "Próximo projeto",
      overview: "Visão geral",
      status: "Status",
      statusLive: "No ar",
      statusCode: "Código aberto",
      techCount: "Tecnologias",
      featureCount: "Funcionalidades",
      scrollCue: "Role para ler"
    },
    easterEgg: { message: "千羽鶴: mil tsurus de origami para te desejar sorte!" },
    projects: [
      {
        id: 11, slug: 'imacardios', type: 'fullstack', featured: true, title: 'IMACARDIOS: Telemedicina e Telelaudos',
        stack: ['Next.js', 'React', 'NestJS', 'TypeScript', 'Prisma', 'PostgreSQL', 'Swagger', 'Jest', 'Playwright', 'Supertest'],
        shortDesc: 'Plataforma B2B de telecardiologia em produção: 42+ clínicas e 2.000+ laudos por mês.',
        longDesc: 'Freelance remunerado, desenvolvido em dupla. A IMACARDIOS é uma plataforma B2B de telecardiologia em produção, atendendo redes de saúde no Brasil e na América Latina, hoje com mais de 42 clínicas e mais de 2.000 laudos assinados por mês.\n\nProjetei o isolamento de dados sensíveis (CPF e diagnóstico fora do banco principal) e o isolamento entre clínicas em duas camadas: na aplicação e nas regras do Postgres. O back-end em NestJS + Prisma/PostgreSQL é documentado com Swagger e coberto por testes.',
        features: ['Plataforma multi-tenant com isolamento entre clínicas em duas camadas', 'Dados sensíveis (CPF e diagnóstico) fora do banco principal', '2FA obrigatório para médicos e administradores (LGPD)', 'Back-end em NestJS + Prisma/PostgreSQL', 'API documentada com Swagger/OpenAPI', 'Testes com Jest, Playwright e Supertest', 'Em produção no Brasil e na América Latina'],
        repoLink: null, deployLink: 'https://app.imacardios.com',
        images: [], imageMobile: false, image: null
      },
      {
        id: 12, slug: 'saeko-artes', type: 'front', title: 'Saeko Artes: Catálogo de Amigurumis',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'React Three Fiber', 'Zustand', 'Framer Motion', 'Lenis'],
        shortDesc: 'Catálogo de um ateliê de crochê com frete real dos Correios, cotado pelo Melhor Envio, e pedido pelo WhatsApp.',
        longDesc: 'Landing page e catálogo digital da Saeko Artes, ateliê artesanal de amigurumis de Mairinque (SP). As peças aparecem numa vitrine editorial minimalista, o frete dos Correios é cotado de verdade pela API do Melhor Envio e o pedido é finalizado no WhatsApp, sem checkout, cadastro ou banco de dados.\n\nServer Components por padrão, com "use client" só onde há interação: o carrinho, as animações e o modelo 3D do hero. Cada uma das 28 peças tem uma página estática própria, com metadata e Open Graph.',
        features: ['Modelo 3D de amigurumi no hero com React Three Fiber, carregado sem pesar no LCP', 'Frete real pela API do Melhor Envio numa Server Action: o token nunca chega ao navegador', 'Carrinho em drawer com Zustand e subtotal recalculado em tempo real', 'Pedido montado automaticamente na mensagem do WhatsApp', '28 páginas de produto estáticas com metadata e Open Graph', 'Sitemap e robots gerados dinamicamente'],
        repoLink: 'https://github.com/RaphaelOkuyama/catalago-amigurumis', deployLink: 'https://catalago-amigurumis.vercel.app',
        images: [], imageMobile: false, image: null
      },
      {
        id: 1, slug: 'fit-ai-frontend', type: 'front', group: 'fit-ai', part: 'App', title: 'FIT.AI: App de Treinos',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Google Gemini', 'Better Auth', 'Orval'],
        shortDesc: 'App mobile-first de treinos com coach de IA em tempo real.',
        longDesc: 'O FIT.AI é um aplicativo mobile-first de gestão de treinos com personal trainer virtual integrado. Desenvolvido com Next.js 16 e React 19, o app oferece um onboarding conversacional com IA (Google Gemini 2.5 Flash), onde o coach coleta seus dados físicos e monta um plano de treino personalizado.\n\nAs respostas do coach chegam em streaming via @ai-sdk/react, palavra a palavra, enquanto os dados vêm de Server Components e as mutações passam por Server Actions.',
        features: ['Chat com coach de IA em tempo real', 'Onboarding inteligente e conversacional', 'Dashboard com streak e estatísticas', 'Plano de treino semanal personalizado pela IA', 'Server Components + Server Actions', 'Autenticação com Google OAuth'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-frontend', deployLink: 'https://gestao-de-treino-frontend.onrender.com',
        images: [], imageMobile: true, image: null
      },
      {
        id: 2, slug: 'fit-ai-api', type: 'back', group: 'fit-ai', part: 'API', title: 'FIT.AI: API',
        stack: ['Node.js', 'TypeScript', 'Fastify', 'Prisma', 'PostgreSQL', 'Google Gemini', 'Better Auth', 'Docker', 'Swagger/OpenAPI'],
        shortDesc: 'API da FIT.AI: treinos, progresso e o coach de IA com respostas em streaming.',
        longDesc: 'Back-end da plataforma FIT.AI. A API gerencia usuários, planos de treino, exercícios, sessões e estatísticas de progresso. O ponto central é a integração com o Google Gemini para geração de planos de treino personalizados e respostas em streaming do coach virtual.',
        features: ['Integração com Google Gemini', 'Streaming de respostas do coach via SSE', 'Documentação automática com Swagger/OpenAPI', 'Autenticação com Google OAuth', 'Containerizado com Docker', 'Arquitetura em camadas com Fastify', 'Prisma ORM com PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-api', deployLink: 'https://gestao-de-treino-api.onrender.com',
        images: [], imageMobile: false, image: null
      },
      {
        id: 3, slug: 'totem-autoatendimento', type: 'fullstack', title: 'Totem de Autoatendimento',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Prisma', 'PostgreSQL', 'Stripe'],
        shortDesc: 'Autoatendimento para totem touchscreen, do cardápio ao pagamento com Stripe.',
        longDesc: 'Sistema de autoatendimento feito para rodar num totem touchscreen físico. O fluxo cobre da seleção do tipo de pedido até o pagamento integrado com Stripe, passando por cardápio com categorias, detalhes do produto e sacola.',
        features: ['Interface otimizada para touchscreen', 'Cardápio com categorias dinâmicas', 'Sacola com controle de quantidade e total', 'Pagamento integrado com Stripe Checkout', 'Tela de confirmação de pagamento em tempo real', 'Consulta de pedidos por CPF', 'Banco de dados com Prisma + PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/totem-autoatendimento', deployLink: 'https://totem-autoatendimento.vercel.app',
        images: TOTEM_IMGS, imageMobile: true, image: null
      },
      {
        id: 13, slug: 'arca-construtora', type: 'front', title: 'ARCA: Landing Page para Construtora',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Canvas API'],
        shortDesc: 'Landing page de alto padrão com animações em canvas e storytelling guiado pelo scroll.',
        longDesc: 'Landing page institucional (projeto conceito) para uma construtora de alto padrão. O foco está na camada visual: animações em canvas, storytelling controlado pelo scroll e microinterações que transmitem a sofisticação de um portfólio arquitetônico.\n\nUma única página, 100% estática, composta por treze blocos independentes, do preloader ao rodapé.',
        features: ['Preloader com um prédio que se ergue andar por andar e partículas em canvas', 'Vídeo de drone no hero desenhado em canvas no desktop e vídeo nativo leve no celular', 'Sequência de 63 quadros da obra sincronizada com o scroll, com carregamento sob demanda', 'Cards de obras com parallax 3D e reflexo de luz seguindo o mouse', 'Contadores animados, depoimentos em carrossel e FAQ em accordion'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-construtoras', deployLink: 'https://landing-page-exemple-construtoras.vercel.app',
        images: [], imageMobile: false, image: null
      },
      {
        id: 14, slug: 'glow-laser', type: 'front', title: 'GLOW LASER: Landing Page para Clínica',
        stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS v4'],
        shortDesc: 'Landing page com quiz de diagnóstico e calculadora de investimento que levam ao WhatsApp.',
        longDesc: 'Landing page (projeto conceito) para clínicas de estética e depilação a laser, com identidade editorial e duas ferramentas de captação de clientes: um quiz de diagnóstico e uma calculadora de investimento. Todos os caminhos levam ao WhatsApp.\n\nServer Components por padrão e "use client" só nas partes interativas.',
        features: ['Comparador antes e depois com divisor arrastável (mouse e toque), sem re-render do React', 'Quiz de 4 perguntas que sugere protocolo e número de sessões', 'Calculadora de investimento em tempo real, em reais', 'Hero com vídeo e plano B para o autoplay bloqueado no celular', 'Header com barra de progresso de leitura e seção ativa destacada'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-clinicas', deployLink: 'https://landing-page-exemple-clinicas.vercel.app',
        images: [], imageMobile: false, image: null
      },
      {
        id: 15, slug: 'portfolio-okuyama', type: 'front', title: 'Este Portfólio: a Montanha Okuyama',
        stack: ['Next.js 16', 'React 19', 'Three.js', 'React Three Fiber', 'GSAP', 'Zustand', 'Lenis', 'Playwright'],
        shortDesc: 'Portfólio imersivo em 3D: uma caminhada para dentro da montanha pelas quatro estações.',
        longDesc: 'Este site. Um portfólio imersivo em que rolar a página é adentrar a montanha (奥山, "montanha profunda"): a cena 3D passa pelas quatro estações, do sakura à neve, com torii, jardim zen e um rio de lanternas no fim.\n\nCena em Three.js com React Three Fiber e shaders próprios, animações com GSAP e testes unitários (Vitest) e e2e (Playwright) cobrindo cada seção.',
        features: ['Cena 3D com estações, névoa, floresta, jardim zen e rio desenhados com shaders próprios', 'Projetos num emakimono que se desenrola na horizontal com o scroll', 'Formulário de contato que vira uma lanterna descendo o rio', 'Imagens de compartilhamento geradas por projeto e dados estruturados de Pessoa', 'Fundo pintado em SVG para quem não tem WebGL', 'Testes unitários e e2e de cada seção'],
        repoLink: 'https://github.com/RaphaelOkuyama/portfolio', deployLink: 'https://portfolio-raphael-okuyama.vercel.app',
        images: [], imageMobile: false, image: null
      },
      { 
        id: 4, slug: 'devflix-frontend', type: 'front', group: 'devflix', part: 'Front-end', title: 'DevFlix Frontend', 
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'Front-end de uma plataforma de cursos inspirada na Netflix.',
        longDesc: 'Front-end da DevFlix, uma plataforma de cursos online com a navegação da Netflix: vitrines por categoria, episódios e progresso de cada aula. Consome a API da DevFlix com Axios e SWR.',
        features: ['Interface responsiva, pensada primeiro para o celular', 'Páginas renderizadas no servidor (SSR)', 'Dados da API com Axios e cache com SWR', 'Estilos em módulos Sass'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 5, slug: 'devflix-backend', type: 'back', group: 'devflix', part: 'API', title: 'DevFlix API', 
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT'], 
        shortDesc: 'API da DevFlix: cursos, episódios, favoritos e login com JWT.',
        longDesc: 'API REST da DevFlix em Express, Sequelize e PostgreSQL. Guarda o catálogo de cursos e episódios, os favoritos e o progresso de cada aluno, com login por JWT e um painel administrativo em AdminJS.',
        features: ['Login com JWT', 'Categorias, cursos, episódios e favoritos', 'Progresso de visualização por aluno', 'Painel administrativo com AdminJS', 'Modelo relacional com Sequelize e PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 6, slug: 'player-electron', type: 'desktop', title: 'Music Player Desktop', 
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'Player de música desktop com Electron, tocando arquivos locais.',
        longDesc: 'App desktop multiplataforma feito com Electron e React. Lê as músicas direto do computador, monta playlists e controla a reprodução, coisas que uma página no navegador não consegue fazer sozinha.',
        features: ['Importação de músicas do computador', 'Play, pause e próxima faixa', 'Criação de playlists', 'Acesso ao sistema de arquivos pelo Electron'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 7, slug: 'react-kanban', type: 'front', title: 'React Kanban', 
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Quadro Kanban com arrastar e soltar entre colunas.',
        longDesc: 'Quadro Kanban em React e TypeScript: as tarefas são arrastadas entre colunas, criadas e editadas em diálogos acessíveis do Radix UI e validadas com Zod antes de ir para a API (json-server).',
        features: ['Arrastar e soltar tarefas entre colunas', 'Criar, editar e excluir tarefas (json-server)', 'Validação de formulários com Zod', 'Componentes acessíveis com Radix UI'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 8, slug: 'api-leadmagnet', type: 'back', title: 'API Lead Magnet', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'API REST para organizar leads em grupos e campanhas.',
        longDesc: 'API REST em Express e TypeScript para guardar leads e organizá-los em grupos e campanhas. Toda entrada é validada com Zod e os dados ficam no PostgreSQL via Prisma.',
        features: ['Cadastro e consulta de leads', 'Leads organizados em grupos e campanhas', 'Validação das requisições com Zod', 'Prisma com PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 9, slug: 'api-library', type: 'back', title: 'Library Auth API', 
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'API de biblioteca com login por JWT e senhas com hash.',
        longDesc: 'Simula o back-end de uma biblioteca: livros, usuários e empréstimos. As senhas são guardadas com hash Bcrypt, nunca em texto puro, e as rotas sensíveis só respondem com um token JWT válido.',
        features: ['Senhas com hash Bcrypt', 'Rotas protegidas por token JWT', 'Controle de empréstimos', 'Identificadores únicos com UUID'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 10, slug: 'star-wars-catalog', type: 'front', title: 'Star Wars Catalog', 
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Catálogo de naves de Star Wars com dados da SWAPI.',
        longDesc: 'Catálogo em Next.js que busca as naves na API pública de Star Wars (SWAPI) e gera uma página de detalhes para cada uma, com rotas dinâmicas.',
        features: ['Dados da API pública SWAPI', 'Carregamento assíncrono dos dados', 'Navegação por categorias', 'Página de detalhes com rota dinâmica'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog', deployLink: 'https://star-wars-spaceships-catalog.vercel.app', images: [], imageMobile: false, image: null
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
        error: "Erro ao enviar mensagem. Tente novamente.",
        network: "Erro de conexão. Verifique sua rede.",
        rate: "Muitas mensagens em pouco tempo. Tente de novo em alguns minutos.",
        unavailable: "O envio está fora do ar agora. Escreva direto para raphaelokuyama123@gmail.com."
      }
    }
  },

  en: {
    nav: { home: "Home", projects: "Projects", certificates: "Certificates", contact: "Contact" },
    footer: {
      rights: "All rights reserved.",
      lead: "Thanks for walking deep into the mountain with me.",
      top: "Back to top",
      navTitle: "Navigation",
      socialTitle: "Find me",
      timeTitle: "Right now in",
      cities: { saoPaulo: "São Paulo", tokyo: "Tokyo" },
      seasonLabel: "Microseason in Japan",
    },
    hero: {
      roles: ['Full-Stack Developer', 'APIs & Clean Architecture', 'Integrations & AI'],
      summary: 'I build software that runs for real: my code serves 42+ clinics and signs 2,000+ medical reports a month.',
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
      lead: 'My story starts long before code.',
      paragraphs: [
        'I am of Japanese descent on both my father’s and my mother’s side, and Japanese culture has always been part of my family: in my grandparents, our customs and the small traditions. 奥山 (Okuyama) means "deep mountain", something that comes from far away, keeps stories and lives on in new generations.',
        'Technology is where I found a way to turn curiosity into concrete things: products that bring together engineering, interaction and design. Beyond code, I like chess and trying out new ideas.',
        'Today I am a full-stack developer, studying Computer Engineering at FACENS, looking for a team where I can build products end to end.',
      ],
      names: [
        { kanji: '奥山', romaji: 'Okuyama', note: 'father’s family · "deep mountain"' },
        { kanji: '芳賀', romaji: 'Haga', note: 'mother’s family' },
      ],
      btnResume: 'Download CV',
      btnContact: 'Get in touch'
    },
    techSection: {
      title: "Technologies & Tools",
      hint: "Each branch of the bonsai is an area and each leaf, a tool. Pick a branch to see what grows on it.",
      toolsCount: "tools",
      categories: [
        { name: "Languages", kanji: "言", items: ["TypeScript", "JavaScript", "Python", "SQL", "GLSL"] },
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
      areas: { full: "Bootcamps & Programs", front: "Front-end", back: "Back-end & Data", base: "Fundamentals" },
    },
    // Agrupados por área; trilhas juntam módulos do mesmo curso (cada módulo tem o seu certificado)
    certificates: [
      { id: 1, area: "full", icon: "award", name: "Bootcamp: AI Workout Management", institution: "Full Stack Club", link: "https://drive.google.com/file/d/1J4_pW5k-evrK_8dXGEmkQQbfwGxRMTEU/view?usp=sharing", kind: "bootcamp" },
      { id: 2, area: "full", icon: "award", name: "Self Checkout Bootcamp", institution: "Full Stack Club", link: "https://drive.google.com/file/d/1P_JxOakam_Lco3Tv2MNo66Vv5jGSCI-C/view?usp=sharing", kind: "bootcamp" },
      { id: 3, area: "full", icon: "award", name: "Fullstack JavaScript Formation", institution: "OneBitCode", link: "https://drive.google.com/file/d/1gluZITKLl67R8j4oVN8QurlOF9EzMZXY/view?usp=sharing", kind: "formation" },
      { id: 4, area: "front", icon: "react", name: "Netflix-Inspired E-Learning Project", institution: "OneBitCode", link: "https://drive.google.com/file/d/1qGPGox8LHMQvd20dD4pstXmW2VPXht_y/view?usp=sharing" },
      { id: 5, area: "front", icon: "next.js", name: "NextJS Course", institution: "OneBitCode", link: "https://drive.google.com/file/d/1I7Jr9McP_IQKRmEDMO2j2A3WGVGGT77e/view?usp=sharing" },
      { id: 10, area: "front", icon: "react", name: "React Course", institution: "OneBitCode", link: "https://drive.google.com/file/d/143jdZvzdgUTiT0R6_V_ZCymxu0Is5Vpt/view?usp=sharing" },
      { id: 11, area: "front", icon: "css3", name: "Modern CSS", institution: "OneBitCode", link: "https://drive.google.com/file/d/1Q6N1BaPZFOH0ECOJie2FTGjGQDOLCUNA/view?usp=sharing" },
      { id: 12, area: "front", icon: "bootstrap", name: "Bootstrap and SASS", institution: "OneBitCode", link: "https://drive.google.com/file/d/1_PgBGaWfj5Eqh9I80gETuPDQUgF1C5Ri/view?usp=sharing" },
      { id: 22, area: "front", icon: "html5", name: "HTML5 Course", institution: "OneBitCode", link: "https://drive.google.com/file/d/1hCZmPBx-J6WAThP4KQ9ITreUmMPJDbdQ/view?usp=sharing" },
      { id: 21, area: "front", icon: "css3", name: "CSS3 Course", institution: "OneBitCode", link: "https://drive.google.com/file/d/1V-AgaPuW-leQy-qSWsBmzcXM3DC7oMht/view?usp=sharing" },
      { id: 6, area: "back", icon: "prisma", name: "SQL in NodeJS and Prisma ORM", institution: "OneBitCode", link: "https://drive.google.com/file/d/1X9EpEiLNA7LZc08FDdAZXLUlyt4jxBl7/view?usp=sharing" },
      { id: 23, area: "back", icon: "node.js", name: "NodeJS Track", institution: "OneBitCode", modules: [{ label: "NodeJS Course", link: "https://drive.google.com/file/d/1jMbrhElEAFEOHY5ph5wtRQOCDQSz74mE/view?usp=sharing" }, { label: "NodeJS in Web Applications", link: "https://drive.google.com/file/d/1YBDj_Hz9bAF7C5Z9ZYs8T3DeVdFNsWi2/view?usp=sharing" }] },
      { id: 9, area: "back", icon: "postgresql", name: "SQL Database Course", institution: "OneBitCode", link: "https://drive.google.com/file/d/1Wob8BdSy3bIvIGk_is74AgBpmS9hNsew/view?usp=sharing" },
      { id: 24, area: "base", icon: "javascript", name: "JavaScript Track", institution: "OneBitCode", modules: [{ label: "I", link: "https://drive.google.com/file/d/1J3Pdmk_8pK1hA7Cd4devshM-shOnq-6w/view?usp=sharing" }, { label: "II", link: "https://drive.google.com/file/d/1Z5Jhrd9rvUtMd7tCh-VC1TYonAwHzeLC/view?usp=sharing" }, { label: "III", link: "https://drive.google.com/file/d/1l6zWN9JktClgEZkRvMaK_36A4U9mxu0A/view?usp=sharing" }, { label: "IV", link: "https://drive.google.com/file/d/1pbuD3XndCasiNHj19GhzltGbI3P7pUoN/view?usp=sharing" }, { label: "V", link: "https://drive.google.com/file/d/1fgRLJXx3DUgjQTHKmV4X17mtBmr90RhV/view?usp=sharing" }, { label: "VI", link: "https://drive.google.com/file/d/1V0vWxi38c02czMZz9MdrYeQfmySThWgq/view?usp=sharing" }] },
      { id: 14, area: "base", icon: "typescript", name: "TypeScript Course", institution: "OneBitCode", link: "https://drive.google.com/file/d/149wMZ6nlMpb_ZZSry_ghUJFeCUi7Gblf/view?usp=sharing" },
      { id: 13, area: "base", icon: "git", name: "Git and GitHub", institution: "OneBitCode", link: "https://drive.google.com/file/d/16SjZpNj47YW_ceOeEWhM81rBJyYWd5Vt/view?usp=sharing" },
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
      prevProject: "Previous project",
      nextProject: "Next project",
      overview: "Overview",
      status: "Status",
      statusLive: "Live",
      statusCode: "Open source",
      techCount: "Technologies",
      featureCount: "Features",
      scrollCue: "Scroll to read"
    },
    easterEgg: { message: "千羽鶴: a thousand paper cranes wishing you good luck!" },
    projects: [
      {
        id: 11, slug: 'imacardios', type: 'fullstack', featured: true, title: 'IMACARDIOS: Telemedicine & Remote Reports',
        stack: ['Next.js', 'React', 'NestJS', 'TypeScript', 'Prisma', 'PostgreSQL', 'Swagger', 'Jest', 'Playwright', 'Supertest'],
        shortDesc: 'B2B telecardiology platform in production: 42+ clinics and 2,000+ reports per month.',
        longDesc: 'Paid freelance project, built in a team of two. IMACARDIOS is a B2B telecardiology platform in production, serving healthcare networks in Brazil and Latin America, now with 42+ clinics and 2,000+ signed reports per month.\n\nI designed the isolation of sensitive data (CPF and diagnosis kept outside the main database) and tenant isolation between clinics in two layers: in the application and in Postgres rules. The NestJS + Prisma/PostgreSQL back end is documented with Swagger and covered by tests.',
        features: ['Multi-tenant platform with two-layer clinic isolation', 'Sensitive data (CPF and diagnosis) kept outside the main database', 'Mandatory 2FA for doctors and admins (LGPD)', 'NestJS + Prisma/PostgreSQL back end', 'API documented with Swagger/OpenAPI', 'Tests with Jest, Playwright and Supertest', 'In production across Brazil and Latin America'],
        repoLink: null, deployLink: 'https://app.imacardios.com',
        images: [], imageMobile: false, image: null
      },
      {
        id: 12, slug: 'saeko-artes', type: 'front', title: 'Saeko Artes: Amigurumi Catalog',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'React Three Fiber', 'Zustand', 'Framer Motion', 'Lenis'],
        shortDesc: 'Catalog for a crochet studio with real shipping quotes and ordering through WhatsApp.',
        longDesc: 'Landing page and digital catalog for Saeko Artes, a handmade amigurumi studio from Mairinque (Brazil). Pieces are shown in a minimalist editorial gallery, real Brazilian postal shipping is quoted through the Melhor Envio API, and orders are completed on WhatsApp, with no checkout, sign-up or database.\n\nServer Components by default, with "use client" only where there is interaction: the cart, the animations and the 3D model in the hero. Each of the 28 pieces has its own static page, with metadata and Open Graph.',
        features: ['3D amigurumi model in the hero with React Three Fiber, loaded without hurting LCP', 'Real shipping quotes from the Melhor Envio API in a Server Action: the token never reaches the browser', 'Drawer cart with Zustand and a live subtotal', 'Order automatically written into the WhatsApp message', '28 static product pages with metadata and Open Graph', 'Dynamically generated sitemap and robots'],
        repoLink: 'https://github.com/RaphaelOkuyama/catalago-amigurumis', deployLink: 'https://catalago-amigurumis.vercel.app',
        images: [], imageMobile: false, image: null
      },
      {
        id: 1, slug: 'fit-ai-frontend', type: 'front', group: 'fit-ai', part: 'App', title: 'FIT.AI: Workout App',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Google Gemini', 'Better Auth', 'Orval'],
        shortDesc: 'Mobile-first workout app with real-time AI coach.',
        longDesc: 'FIT.AI is a mobile-first workout management app with an integrated virtual personal trainer. Built with Next.js 16 and React 19, the app features a conversational AI onboarding (Google Gemini 2.5 Flash), where the coach collects your physical data and builds a personalized workout plan.',
        features: ['Real-time AI coach chat', 'Intelligent conversational onboarding', 'Dashboard with streak and statistics', 'AI-generated personalized weekly workout plan', 'Server Components + Server Actions', 'Google OAuth authentication'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-frontend', deployLink: 'https://gestao-de-treino-frontend.onrender.com',
        images: [], imageMobile: true, image: null
      },
      {
        id: 2, slug: 'fit-ai-api', type: 'back', group: 'fit-ai', part: 'API', title: 'FIT.AI: API',
        stack: ['Node.js', 'TypeScript', 'Fastify', 'Prisma', 'PostgreSQL', 'Google Gemini', 'Better Auth', 'Docker', 'Swagger/OpenAPI'],
        shortDesc: 'The FIT.AI API: workouts, progress and the AI coach with streamed replies.',
        longDesc: 'Back end of the FIT.AI platform. The API manages users, workout plans, exercises, sessions and progress statistics. The core feature is the integration with Google Gemini for generating personalized workout plans and streaming virtual coach responses.',
        features: ['Google Gemini integration for workout generation', 'Streaming coach responses via SSE', 'Automatic documentation with Swagger/OpenAPI', 'Google OAuth authentication', 'Containerized with Docker', 'Layered architecture with Fastify', 'Prisma ORM with PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-api', deployLink: 'https://gestao-de-treino-api.onrender.com',
        images: [], imageMobile: false, image: null
      },
      {
        id: 3, slug: 'totem-autoatendimento', type: 'fullstack', title: 'Self-Service Kiosk',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Prisma', 'PostgreSQL', 'Stripe'],
        shortDesc: 'Self-service ordering for a touchscreen kiosk, from menu to Stripe payment.',
        longDesc: 'A self-service system built to run on a physical touchscreen kiosk. The flow covers everything from order type selection to Stripe payment processing, through a dynamic menu with categories, product details and bag management.',
        features: ['Interface optimized for touchscreen', 'Dynamic menu with categories', 'Bag with quantity control and total', 'Stripe Checkout payment integration', 'Real-time payment confirmation screen', 'Order history lookup by CPF', 'Database with Prisma + PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/totem-autoatendimento', deployLink: 'https://totem-autoatendimento.vercel.app',
        images: TOTEM_IMGS, imageMobile: true, image: null
      },
      {
        id: 13, slug: 'arca-construtora', type: 'front', title: 'ARCA: Construction Company Landing Page',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Canvas API'],
        shortDesc: 'High-end landing page with canvas animations and scroll-driven storytelling.',
        longDesc: 'Institutional landing page (concept project) for a high-end construction company. The focus is the visual layer: canvas animations, scroll-driven storytelling and micro-interactions that convey the sophistication of an architecture portfolio.\n\nA single, fully static page made of thirteen independent blocks, from the preloader to the footer.',
        features: ['Preloader with a building rising floor by floor and canvas particles', 'Drone video in the hero drawn on canvas on desktop, with a light native video on mobile', '63-frame construction sequence synced to scroll, loaded on demand', 'Project cards with 3D parallax and a light glare following the mouse', 'Animated counters, testimonial carousel and FAQ accordion'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-construtoras', deployLink: 'https://landing-page-exemple-construtoras.vercel.app',
        images: [], imageMobile: false, image: null
      },
      {
        id: 14, slug: 'glow-laser', type: 'front', title: 'GLOW LASER: Clinic Landing Page',
        stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS v4'],
        shortDesc: 'Landing page with a diagnosis quiz and an investment calculator that lead to WhatsApp.',
        longDesc: 'Landing page (concept project) for aesthetics and laser hair removal clinics, with an editorial identity and two lead capture tools: a diagnosis quiz and an investment calculator. Every path leads to WhatsApp.\n\nServer Components by default and "use client" only in the interactive parts.',
        features: ['Before and after slider with a draggable divider (mouse and touch), without React re-renders', '4-question quiz that suggests a protocol and number of sessions', 'Live investment calculator in Brazilian reais', 'Video hero with a fallback for blocked autoplay on mobile', 'Header with a reading progress bar and active section highlight'],
        repoLink: 'https://github.com/RaphaelOkuyama/landing-page-exemple-clinicas', deployLink: 'https://landing-page-exemple-clinicas.vercel.app',
        images: [], imageMobile: false, image: null
      },
      {
        id: 15, slug: 'portfolio-okuyama', type: 'front', title: 'This Portfolio: the Okuyama Mountain',
        stack: ['Next.js 16', 'React 19', 'Three.js', 'React Three Fiber', 'GSAP', 'Zustand', 'Lenis', 'Playwright'],
        shortDesc: 'Immersive 3D portfolio: a walk deep into the mountain through the four seasons.',
        longDesc: 'This site. An immersive portfolio where scrolling the page takes you deep into the mountain (奥山, "deep mountain"): the 3D scene goes through the four seasons, from sakura to snow, with a torii, a zen garden and a river of lanterns at the end.\n\nThree.js scene with React Three Fiber and custom shaders, GSAP animations, and unit (Vitest) and e2e (Playwright) tests covering every section.',
        features: ['3D scene with seasons, fog, forest, zen garden and river drawn with custom shaders', 'Projects on an emakimono scroll that unrolls horizontally', 'Contact form that turns into a lantern floating down the river', 'Per-project share images and Person structured data', 'Painted SVG backdrop for browsers without WebGL', 'Unit and e2e tests for every section'],
        repoLink: 'https://github.com/RaphaelOkuyama/portfolio', deployLink: 'https://portfolio-raphael-okuyama.vercel.app',
        images: [], imageMobile: false, image: null
      },
      { 
        id: 4, slug: 'devflix-frontend', type: 'front', group: 'devflix', part: 'Front-end', title: 'DevFlix Frontend', 
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'Front end of a Netflix-inspired course platform.',
        longDesc: 'Front end of DevFlix, an online course platform with Netflix-style browsing: rows by category, episodes and progress for each lesson. It talks to the DevFlix API with Axios and SWR.',
        features: ['Responsive, mobile-first interface', 'Server-side rendered pages (SSR)', 'API data with Axios and SWR caching', 'Sass module styles'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 5, slug: 'devflix-backend', type: 'back', group: 'devflix', part: 'API', title: 'DevFlix API', 
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT'], 
        shortDesc: 'DevFlix API: courses, episodes, favorites and JWT login.',
        longDesc: 'DevFlix REST API in Express, Sequelize and PostgreSQL. It stores the catalog of courses and episodes, favorites and each student’s progress, with JWT login and an AdminJS admin panel.',
        features: ['JWT login', 'Categories, courses, episodes and favorites', 'Per-student watch progress', 'AdminJS admin panel', 'Relational model with Sequelize and PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 6, slug: 'player-electron', type: 'desktop', title: 'Music Player Desktop', 
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'Electron desktop music player for local files.',
        longDesc: 'Cross-platform desktop app built with Electron and React. It reads music straight from the computer, builds playlists and controls playback, things a web page cannot do on its own.',
        features: ['Import music from the computer', 'Play, pause and next track', 'Playlist creation', 'File system access through Electron'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 7, slug: 'react-kanban', type: 'front', title: 'React Kanban', 
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Kanban board with drag and drop between columns.',
        longDesc: 'Kanban board in React and TypeScript: tasks are dragged between columns, created and edited in accessible Radix UI dialogs and validated with Zod before reaching the API (json-server).',
        features: ['Drag and drop tasks between columns', 'Create, edit and delete tasks (json-server)', 'Form validation with Zod', 'Accessible Radix UI components'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 8, slug: 'api-leadmagnet', type: 'back', title: 'API Lead Magnet', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'REST API to organize leads into groups and campaigns.',
        longDesc: 'REST API in Express and TypeScript that stores leads and organizes them into groups and campaigns. Every request is validated with Zod and the data lives in PostgreSQL through Prisma.',
        features: ['Create and query leads', 'Leads organized into groups and campaigns', 'Request validation with Zod', 'Prisma with PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 9, slug: 'api-library', type: 'back', title: 'Library Auth API', 
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'Library API with JWT login and hashed passwords.',
        longDesc: 'Simulates a library back end: books, users and loans. Passwords are stored as Bcrypt hashes, never in plain text, and sensitive routes only respond to a valid JWT.',
        features: ['Bcrypt password hashing', 'JWT-protected routes', 'Loan management', 'Unique IDs with UUID'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 10, slug: 'star-wars-catalog', type: 'front', title: 'Star Wars Catalog', 
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Star Wars starship catalog with SWAPI data.',
        longDesc: 'Next.js catalog that fetches starships from the public Star Wars API (SWAPI) and builds a detail page for each one with dynamic routes.',
        features: ['Data from the public SWAPI', 'Asynchronous data loading', 'Category navigation', 'Detail page with a dynamic route'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog', deployLink: 'https://star-wars-spaceships-catalog.vercel.app', images: [], imageMobile: false, image: null
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
        error: "Failed to send the message. Please try again.",
        network: "Connection error. Check your network.",
        rate: "Too many messages in a short time. Please try again in a few minutes.",
        unavailable: "Sending is down right now. Please email raphaelokuyama123@gmail.com directly."
      }
    }
  }
};