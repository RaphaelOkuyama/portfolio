// ============================================================
// NOTAS SOBRE AS IMAGENS DO TOTEM:
// /public/projects/totem/tela-01.png
// ============================================================

const TOTEM_IMGS = [
  { src: '/projects/totem/tela-01.png', alt: 'Tela de boas-vindas' },
  { src: '/projects/totem/tela-02.png', alt: 'Cardápio de combos' },
  { src: '/projects/totem/tela-03.png', alt: 'Detalhes do produto' },
];

export const resumeData = {
  pt: {
    nav: { home: "Home", projects: "Projetos", certificates: "Certificados", contact: "Contato" },
    footer: { rights: "Todos os direitos reservados." },
    hero: { 
      roles: ['Desenvolvedor Full-Stack', 'Análise de Dados', 'Automação'], 
      location: 'Mairinque/SP', 
      scroll: 'Role para explorar',
      summary: 'Transformando problemas complexos em soluções digitais elegantes e eficientes.'
    },
    about: {
      title: 'Sobre Mim',
      desc: 'Sou Raphael Nobuyuki Haga Okuyama, estudante do 9º semestre de Engenharia de Computação na FACENS. Atuo como Desenvolvedor de Software Full-Stack, unindo minha base em engenharia com a paixão por construir soluções digitais escaláveis. Atualmente, estou me aprofundando no ecossistema Python, Análise de Dados e Automação, buscando expandir minhas capacidades para desenvolver aplicações mais inteligentes e orientadas a dados.',
      skillsTitle: 'Habilidades & Ferramentas',
      btnResume: 'Baixar Currículo'
    },
    techSection: {
      title: "Tecnologias & Ferramentas",
      categories: [
        { name: "Linguagens", items: ["TypeScript", "JavaScript", "Python", "HTML5", "CSS3"] },
        { name: "Front-end", items: ["React", "Next.js", "Tailwind CSS", "Shadcn/ui", "Radix UI", "Framer Motion"] },
        { name: "Back-end", items: ["Node.js", "Express", "Fastify", "RESTful APIs"] },
        { name: "Bancos de Dados & ORM", items: ["PostgreSQL", "MySQL", "MongoDB", "Prisma ORM", "Drizzle ORM"] },
        { name: "DevOps & Deploy", items: ["Docker", "Git/GitHub", "CI/CD (Actions)", "Vercel", "Render"] },
        { name: "Arquitetura & Qualidade", items: ["MVC", "SOLID", "Clean Code", "Zod", "ESLint", "Prettier", "JWT/OAuth"] },
        { name: "Ferramentas & Metodologias", items: ["Scrum", "Kanban", "Figma", "UI/UX Design", "Prototipagem", "Electron.js"] }
      ]
    },
    experienceTitle: "Experiência Profissional",
    experience: [
      { 
        id: 1, 
        year: 'Abr 2022 - Fev 2025', 
        role: 'Técnico de TI', 
        company: 'Supermercado Mairinque', 
        desc: 'Garantia de alta disponibilidade prestando suporte para 40+ PDVs e self-checkouts em ambiente de alto volume. Criei relatórios de análise de dados no Power BI/Excel para correção de cadastros no ERP (VR Software). Atuação na administração de servidores e manutenção de infraestrutura.' 
      },
      { 
        id: 2, 
        year: 'Fev 2025 - Atual', 
        role: 'Estágio de TI', 
        company: 'Prefeitura de Mairinque', 
        desc: 'Reduzi o volume de chamados de 60+ para <10 otimizando fluxos de suporte. Desenvolvi automações em Python para onboarding e imagens customizadas do Windows, agilizando drasticamente o setup de máquinas. Responsável também pela administração de servidores e infraestrutura de rede.' 
      },
      { 
        id: 3, 
        year: 'Atualmente', 
        role: 'Programador Full-Stack', 
        company: 'Disponível para Oportunidades', 
        desc: 'Profissional focado em impacto e resultados, pronto para integrar equipes ágeis. Com sólida base acadêmica e portfólio prático, busco aplicar minha experiência em automação (Python), dados e desenvolvimento web (React/Node) para criar soluções escaláveis.' 
      }
    ],
    certificatesPage: { 
      title: "Certificados & Cursos", 
      subtitle: "Em constante expansão de conhecimento e sempre aprendendo novas tecnologias.",
      btnView: "Ver Certificado"
    },
    certificates: [
      // ORDEM: Bootcamps -> Fullstack -> EAD -> Next -> SQL
      { id: 1, name: "Bootcamp - Gestão de Treinos com IA", institution: "Full Stack Club", status: "Concluído", link: "https://drive.google.com/file/d/1J4_pW5k-evrK_8dXGEmkQQbfwGxRMTEU/view?usp=sharing" },
      { id: 2, name: "Bootcamp Self Checkout", institution: "Full Stack Club", status: "Concluído", link: "https://drive.google.com/file/d/1P_JxOakam_Lco3Tv2MNo66Vv5jGSCI-C/view?usp=sharing" },
      { id: 3, name: "Formação Fullstack JavaScript", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1gluZITKLl67R8j4oVN8QurlOF9EzMZXY/view?usp=sharing" },
      { id: 4, name: "Projeto EAD Inspirado no Netflix", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1qGPGox8LHMQvd20dD4pstXmW2VPXht_y/view?usp=sharing" },
      { id: 5, name: "Curso de NextJS", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1I7Jr9McP_IQKRmEDMO2j2A3WGVGGT77e/view?usp=sharing" },
      { id: 6, name: "SQL no NodeJS e Prisma ORM", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1X9EpEiLNA7LZc08FDdAZXLUlyt4jxBl7/view?usp=sharing" },
      
      // RESTANTE DOS CERTIFICADOS
      { id: 7, name: "NodeJS em Aplicações Web", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1YBDj_Hz9bAF7C5Z9ZYs8T3DeVdFNsWi2/view?usp=sharing" },
      { id: 8, name: "Curso de NodeJS", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1jMbrhElEAFEOHY5ph5wtRQOCDQSz74mE/view?usp=sharing" },
      { id: 9, name: "Curso de Banco de Dados SQL", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1Wob8BdSy3bIvIGk_is74AgBpmS9hNsew/view?usp=sharing" },
      { id: 10, name: "Curso de React", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/143jdZvzdgUTiT0R6_V_ZCymxu0Is5Vpt/view?usp=sharing" },
      { id: 11, name: "CSS Moderno", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1Q6N1BaPZFOH0ECOJie2FTGjGQDOLCUNA/view?usp=sharing" },
      { id: 12, name: "Bootstrap e SASS", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1_PgBGaWfj5Eqh9I80gETuPDQUgF1C5Ri/view?usp=sharing" },
      { id: 13, name: "Git e GitHub", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/16SjZpNj47YW_ceOeEWhM81rBJyYWd5Vt/view?usp=sharing" },
      { id: 14, name: "Curso de TypeScript", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/149wMZ6nlMpb_ZZSry_ghUJFeCUi7Gblf/view?usp=sharing" },
      { id: 15, name: "JavaScript VI", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1V0vWxi38c02czMZz9MdrYeQfmySThWgq/view?usp=sharing" },
      { id: 16, name: "JavaScript V", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1fgRLJXx3DUgjQTHKmV4X17mtBmr90RhV/view?usp=sharing" },
      { id: 17, name: "JavaScript IV", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1pbuD3XndCasiNHj19GhzltGbI3P7pUoN/view?usp=sharing" },
      { id: 18, name: "JavaScript III", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1l6zWN9JktClgEZkRvMaK_36A4U9mxu0A/view?usp=sharing" },
      { id: 19, name: "JavaScript II", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1Z5Jhrd9rvUtMd7tCh-VC1TYonAwHzeLC/view?usp=sharing" },
      { id: 20, name: "JavaScript I", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1J3Pdmk_8pK1hA7Cd4devshM-shOnq-6w/view?usp=sharing" },
      { id: 21, name: "Curso de CSS3", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1V-AgaPuW-leQy-qSWsBmzcXM3DC7oMht/view?usp=sharing" },
      { id: 22, name: "Curso de HTML5", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1hCZmPBx-J6WAThP4KQ9ITreUmMPJDbdQ/view?usp=sharing" },
    ],
    projectsPage: { 
      title: "Meus Projetos", 
      subtitle: "Destaque de alguns projetos desenvolvidos. Para explorar mais repositórios, visite meu perfil no GitHub.",
      btnDetails: "Ver Detalhes",
      btnCode: "Ver no GitHub",
      btnDeploy: "Acessar Projeto",
      techs: "Tecnologias Usadas",
      features: "Principais Funcionalidades",
      aboutProject: "Sobre o Projeto",
      projectImage: "Imagem do Projeto",
      loadingText: "Carregando projeto...",
      btnBack: "Voltar"
    },
    projects: [
      {
        id: 1, slug: 'fit-ai-frontend', title: 'FIT.AI — App de Treinos',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Google Gemini', 'Better Auth', 'Orval'],
        shortDesc: 'App mobile-first de treinos com coach de IA em tempo real.',
        longDesc: 'O FIT.AI é um aplicativo mobile-first de gestão de treinos com personal trainer virtual integrado. Desenvolvido com Next.js 16 e React 19, o app oferece um onboarding conversacional com IA (Google Gemini 2.5 Flash), onde o coach coleta seus dados físicos e monta um plano de treino personalizado.\n\nO diferencial técnico está no uso de Server Components para busca de dados, Server Actions para mutações e streaming de respostas do chat em tempo real via @ai-sdk/react.',
        features: ['Chat com coach de IA em tempo real', 'Onboarding inteligente e conversacional', 'Dashboard com streak e estatísticas', 'Plano de treino semanal personalizado pela IA', 'Server Components + Server Actions', 'Autenticação com Google OAuth', 'Interface exclusivamente mobile-first'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-frontend', deployLink: 'https://gestao-de-treino-frontend.onrender.com',
        images: [], imageMobile: true, image: null
      },
      {
        id: 2, slug: 'fit-ai-api', title: 'FIT.AI — API',
        stack: ['Node.js', 'TypeScript', 'Fastify', 'Prisma', 'PostgreSQL', 'Google Gemini', 'Better Auth', 'Docker', 'Swagger/OpenAPI'],
        shortDesc: 'API robusta para plataforma de treinos com IA integrada.',
        longDesc: 'Backend completo da plataforma FIT.AI. A API gerencia usuários, planos de treino, exercícios, sessões e estatísticas de progresso. O ponto central é a integração com o Google Gemini para geração de planos de treino personalizados e respostas em streaming do coach virtual.',
        features: ['Integração com Google Gemini', 'Streaming de respostas do coach via SSE', 'Documentação automática com Swagger/OpenAPI', 'Autenticação com Google OAuth', 'Containerizado com Docker', 'Arquitetura em camadas com Fastify', 'Prisma ORM com PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-api', deployLink: 'https://gestao-de-treino-api.onrender.com',
        images: [], imageMobile: false, image: null
      },
      {
        id: 3, slug: 'totem-autoatendimento', title: 'Totem de Auto-atendimento',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Prisma', 'PostgreSQL', 'Stripe'],
        shortDesc: 'Sistema completo de auto-atendimento com pagamento via Stripe.',
        longDesc: 'Sistema de auto-atendimento completo desenvolvido para funcionar em totem touchscreen físico. O fluxo cobre da seleção do tipo de pedido até o pagamento integrado com Stripe, passando por cardápio com categorias, detalhes do produto e sacola.',
        features: ['Interface otimizada para touchscreen', 'Cardápio com categorias dinâmicas', 'Sacola com controle de quantidade e total', 'Pagamento integrado com Stripe Checkout', 'Tela de confirmação de pagamento em tempo real', 'Consulta de pedidos por CPF', 'Banco de dados com Prisma + PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/totem-autoatendimento', deployLink: 'https://totem-autoatendimento.vercel.app',
        images: TOTEM_IMGS, imageMobile: true, image: null
      },
      { 
        id: 4, slug: 'devflix-frontend', title: 'DevFlix Frontend', 
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'Plataforma EAD inspirada na Netflix.',
        longDesc: 'O objetivo deste projeto foi criar uma plataforma de ensino a distância (EAD) com uma experiência visual imersiva, inspirada na Netflix.',
        features: ['Interface Responsiva (Mobile First)', 'Server-Side Rendering para Performance', 'Consumo de API REST com Axios', 'Estilização Modular com SASS'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 5, slug: 'devflix-backend', title: 'DevFlix API', 
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT'], 
        shortDesc: 'API completa para gestão de streaming.',
        longDesc: 'Este é o motor da plataforma DevFlix. O desafio foi construir uma API robusta que gerenciasse não apenas o catálogo de cursos e episódios, mas também a autenticação segura.',
        features: ['Autenticação Segura (JWT)', 'Gestão de Categorias e Favoritos', 'Controle de Visualizações', 'Modelagem de Dados Relacional'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 6, slug: 'player-electron', title: 'Music Player Desktop', 
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'App desktop nativo para músicas.',
        longDesc: 'Quis ultrapassar as barreiras do navegador e criar uma aplicação Desktop nativa. Este Music Player, construído com Electron, permite interagir com o sistema de arquivos.',
        features: ['Importação de Arquivos Locais', 'Controle de Play, Pause e Próximo', 'Criação de Playlists', 'Integração com Sistema Operacional'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 7, slug: 'react-kanban', title: 'React Kanban', 
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Quadro interativo com Drag-and-Drop.',
        longDesc: 'Desenvolvi um quadro Kanban completo onde a principal funcionalidade é a interatividade: o usuário pode arrastar e soltar tarefas entre colunas.',
        features: ['Smooth Drag-and-Drop', 'CRUD via JSON-Server', 'Validação de Dados com Zod', 'Componentes Acessíveis'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 8, slug: 'api-leadmagnet', title: 'API Lead Magnet', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'Automação de campanhas de marketing.',
        longDesc: 'Esta API RESTful gerencia o ativo mais valioso de uma empresa: os leads. O sistema organiza campanhas e grupos, permitindo operações de CRUD otimizadas.',
        features: ['Captura e Gestão de Leads', 'Organização por Grupos de Campanha', 'Validação de Dados de Entrada', 'Alta Performance com Prisma'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 9, slug: 'api-library', title: 'Library Auth API', 
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'Sistema de livraria focado em segurança.',
        longDesc: 'Simula o backend de uma biblioteca. Senhas nunca são salvas em texto puro e o acesso às rotas sensíveis é protegido por tokens de sessão JWT.',
        features: ['Password Encryption (Bcrypt)', 'Authentication via JWT Token', 'Loan Management', 'Unique Identifiers (UUID)'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 10, slug: 'star-wars-catalog', title: 'Star Wars Catalog', 
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Catálogo de naves consumindo API pública.',
        longDesc: 'Este catálogo explora o poder da renderização dinâmica e do roteamento consumindo a API pública do Star Wars (SWAPI).',
        features: ['External API Consumption (SWAPI)', 'Asynchronous Data Handling', 'Category Navigation', 'Dynamic Item Details'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog', deployLink: null, images: [], imageMobile: false, image: null
      },
    ],
    contactPage: {
      title: "Entre em Contato",
      subtitle: "Vamos construir algo incrível juntos. Preencha o formulário ou me chame nas redes.",
      channels: "Canais de Contato",
      form: { 
        nameLabel: "Nome", namePlaceholder: "Seu Nome", emailLabel: "Email", emailPlaceholder: "Seu Email", 
        messageLabel: "Mensagem", messagePlaceholder: "Sua Mensagem", btn: "Enviar Mensagem" 
      }
    }
  },

  en: {
    nav: { home: "Home", projects: "Projects", certificates: "Certificates", contact: "Contact" },
    footer: { rights: "All rights reserved." },
    hero: { 
      roles: ['Full-Stack Developer', 'Data Analysis', 'Automation'], 
      location: 'Mairinque/SP', 
      scroll: 'Scroll to explore',
      summary: 'Transforming complex problems into elegant and efficient digital solutions.'
    },
    about: {
      title: 'About Me',
      desc: 'I am Raphael Nobuyuki Haga Okuyama, a 9th-semester Computer Engineering student at FACENS. I work as a Full-Stack Software Developer, combining my engineering background with a passion for building scalable digital solutions. Currently, I am deepening my knowledge in the Python ecosystem, Data Analysis, and Automation, seeking to expand my capabilities to develop smarter, data-driven applications.',
      skillsTitle: 'Skills & Tools',
      btnResume: 'Download CV'
    },
    techSection: {
      title: "Technologies & Tools",
      categories: [
        { name: "Languages", items: ["TypeScript", "JavaScript", "Python", "HTML5", "CSS3"] },
        { name: "Front-end", items: ["React", "Next.js", "Tailwind CSS", "Shadcn/ui", "Radix UI", "Framer Motion"] },
        { name: "Back-end", items: ["Node.js", "Express", "Fastify", "RESTful APIs"] },
        { name: "Databases & ORM", items: ["PostgreSQL", "MySQL", "MongoDB", "Prisma ORM", "Drizzle ORM"] },
        { name: "DevOps & Deploy", items: ["Docker", "Git/GitHub", "CI/CD (Actions)", "Vercel", "Render"] },
        { name: "Architecture & Quality", items: ["MVC", "SOLID", "Clean Code", "Zod", "ESLint", "Prettier", "JWT/OAuth"] },
        { name: "Tools & Methodologies", items: ["Scrum", "Kanban", "Figma", "UI/UX Design", "Prototyping", "Electron.js"] }
      ]
    },
    experienceTitle: "Professional Experience",
    experience: [
      { 
        id: 1, 
        year: 'Apr 2022 - Feb 2025', 
        role: 'IT Technician', 
        company: 'Mairinque Supermarket', 
        desc: 'Ensured high availability by providing support for 40+ POS systems and self-checkouts in a high-volume environment. Created data analysis reports in Power BI/Excel to correct ERP (VR Software) records. Managed servers and maintained network infrastructure.' 
      },
      { 
        id: 2, 
        year: 'Feb 2025 - Present', 
        role: 'IT Intern', 
        company: 'Mairinque City Hall', 
        desc: 'Reduced IT support tickets from 60+ to <10 by optimizing workflows. Developed Python automation scripts for onboarding and custom Windows images, drastically speeding up machine setups. Also responsible for server and network infrastructure administration.' 
      },
      { 
        id: 3, 
        year: 'Currently', 
        role: 'Full-Stack Programmer', 
        company: 'Open to Opportunities', 
        desc: 'Results-driven professional ready to join agile teams. With a solid academic foundation and a practical portfolio, I aim to apply my experience in automation (Python), data, and web development (React/Node) to build scalable solutions.' 
      }
    ],
    certificatesPage: { 
      title: "Certificates & Courses", 
      subtitle: "Constantly expanding knowledge and always learning new technologies.",
      btnView: "View Certificate"
    },
    certificates: [
      { id: 1, name: "Bootcamp - AI Workout Management", institution: "Full Stack Club", status: "Completed", link: "https://drive.google.com/file/d/1J4_pW5k-evrK_8dXGEmkQQbfwGxRMTEU/view?usp=sharing" },
      { id: 2, name: "Self Checkout Bootcamp", institution: "Full Stack Club", status: "Completed", link: "https://drive.google.com/file/d/1P_JxOakam_Lco3Tv2MNo66Vv5jGSCI-C/view?usp=sharing" },
      { id: 3, name: "Fullstack JavaScript Formation", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1gluZITKLl67R8j4oVN8QurlOF9EzMZXY/view?usp=sharing" },
      { id: 4, name: "Netflix-Inspired E-Learning Project", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1qGPGox8LHMQvd20dD4pstXmW2VPXht_y/view?usp=sharing" },
      { id: 5, name: "NextJS Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1I7Jr9McP_IQKRmEDMO2j2A3WGVGGT77e/view?usp=sharing" },
      { id: 6, name: "SQL in NodeJS and Prisma ORM", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1X9EpEiLNA7LZc08FDdAZXLUlyt4jxBl7/view?usp=sharing" },
      
      { id: 7, name: "NodeJS in Web Applications", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1YBDj_Hz9bAF7C5Z9ZYs8T3DeVdFNsWi2/view?usp=sharing" },
      { id: 8, name: "NodeJS Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1jMbrhElEAFEOHY5ph5wtRQOCDQSz74mE/view?usp=sharing" },
      { id: 9, name: "SQL Database Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1Wob8BdSy3bIvIGk_is74AgBpmS9hNsew/view?usp=sharing" },
      { id: 10, name: "React Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/143jdZvzdgUTiT0R6_V_ZCymxu0Is5Vpt/view?usp=sharing" },
      { id: 11, name: "Modern CSS", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1Q6N1BaPZFOH0ECOJie2FTGjGQDOLCUNA/view?usp=sharing" },
      { id: 12, name: "Bootstrap and SASS", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1_PgBGaWfj5Eqh9I80gETuPDQUgF1C5Ri/view?usp=sharing" },
      { id: 13, name: "Git and GitHub", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/16SjZpNj47YW_ceOeEWhM81rBJyYWd5Vt/view?usp=sharing" },
      { id: 14, name: "TypeScript Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/149wMZ6nlMpb_ZZSry_ghUJFeCUi7Gblf/view?usp=sharing" },
      { id: 15, name: "JavaScript VI", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1V0vWxi38c02czMZz9MdrYeQfmySThWgq/view?usp=sharing" },
      { id: 16, name: "JavaScript V", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1fgRLJXx3DUgjQTHKmV4X17mtBmr90RhV/view?usp=sharing" },
      { id: 17, name: "JavaScript IV", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1pbuD3XndCasiNHj19GhzltGbI3P7pUoN/view?usp=sharing" },
      { id: 18, name: "JavaScript III", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1l6zWN9JktClgEZkRvMaK_36A4U9mxu0A/view?usp=sharing" },
      { id: 19, name: "JavaScript II", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1Z5Jhrd9rvUtMd7tCh-VC1TYonAwHzeLC/view?usp=sharing" },
      { id: 20, name: "JavaScript I", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1J3Pdmk_8pK1hA7Cd4devshM-shOnq-6w/view?usp=sharing" },
      { id: 21, name: "CSS3 Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1V-AgaPuW-leQy-qSWsBmzcXM3DC7oMht/view?usp=sharing" },
      { id: 22, name: "HTML5 Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1hCZmPBx-J6WAThP4KQ9ITreUmMPJDbdQ/view?usp=sharing" },
    ],
    projectsPage: { 
      title: "My Projects", 
      subtitle: "Highlight of some developed projects. To explore more repositories, visit my GitHub profile.",
      btnDetails: "View Details",
      btnCode: "View on GitHub",
      btnDeploy: "Access Project",
      techs: "Technologies Used",
      features: "Key Features",
      aboutProject: "About the Project",
      projectImage: "Project Image",
      loadingText: "Loading project...",
      btnBack: "Back"
    },
    projects: [
      {
        id: 1, slug: 'fit-ai-frontend', title: 'FIT.AI — Workout App',
        stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'shadcn/ui', 'Google Gemini', 'Better Auth', 'Orval'],
        shortDesc: 'Mobile-first workout app with real-time AI coach.',
        longDesc: 'FIT.AI is a mobile-first workout management app with an integrated virtual personal trainer. Built with Next.js 16 and React 19, the app features a conversational AI onboarding (Google Gemini 2.5 Flash), where the coach collects your physical data and builds a personalized workout plan.',
        features: ['Real-time AI coach chat', 'Intelligent conversational onboarding', 'Dashboard with streak and statistics', 'AI-generated personalized weekly workout plan', 'Server Components + Server Actions', 'Google OAuth authentication', 'Exclusively mobile-first interface'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-frontend', deployLink: 'https://gestao-de-treino-frontend.onrender.com',
        images: [], imageMobile: true, image: null
      },
      {
        id: 2, slug: 'fit-ai-api', title: 'FIT.AI — API',
        stack: ['Node.js', 'TypeScript', 'Fastify', 'Prisma', 'PostgreSQL', 'Google Gemini', 'Better Auth', 'Docker', 'Swagger/OpenAPI'],
        shortDesc: 'Robust API for AI-powered workout platform.',
        longDesc: 'Complete backend for the FIT.AI platform. The API manages users, workout plans, exercises, sessions and progress statistics. The core feature is the integration with Google Gemini for generating personalized workout plans and streaming virtual coach responses.',
        features: ['Google Gemini integration for workout generation', 'Streaming coach responses via SSE', 'Automatic documentation with Swagger/OpenAPI', 'Google OAuth authentication', 'Containerized with Docker', 'Layered architecture with Fastify', 'Prisma ORM with PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/gestao-de-treino-api', deployLink: 'https://gestao-de-treino-api.onrender.com',
        images: [], imageMobile: false, image: null
      },
      {
        id: 3, slug: 'totem-autoatendimento', title: 'Self-Service Kiosk',
        stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Prisma', 'PostgreSQL', 'Stripe'],
        shortDesc: 'Complete self-service system with Stripe payments.',
        longDesc: 'A complete self-service system designed to run on a physical touchscreen kiosk. The flow covers everything from order type selection to Stripe payment processing, through a dynamic menu with categories, product details and bag management.',
        features: ['Interface optimized for touchscreen', 'Dynamic menu with categories', 'Bag with quantity control and total', 'Stripe Checkout payment integration', 'Real-time payment confirmation screen', 'Order history lookup by CPF', 'Database with Prisma + PostgreSQL'],
        repoLink: 'https://github.com/RaphaelOkuyama/totem-autoatendimento', deployLink: 'https://totem-autoatendimento.vercel.app',
        images: TOTEM_IMGS, imageMobile: true, image: null
      },
      { 
        id: 4, slug: 'devflix-frontend', title: 'DevFlix Frontend', 
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'E-learning platform inspired by Netflix.',
        longDesc: 'The goal of this project was to create a distance learning platform with an immersive visual experience, inspired by Netflix.',
        features: ['Responsive Interface (Mobile First)', 'Server-Side Rendering for Performance', 'REST API Consumption with Axios', 'Modular Styling with SASS'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 5, slug: 'devflix-backend', title: 'DevFlix API', 
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT'], 
        shortDesc: 'Complete API for streaming management.',
        longDesc: 'This is the engine of the DevFlix platform. The challenge was to build a robust API that managed not only the catalog of courses and episodes, but also secure authentication.',
        features: ['Secure Authentication (JWT)', 'Management of Categories and Favorites', 'View Control', 'Relational Data Modeling'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 6, slug: 'player-electron', title: 'Music Player Desktop', 
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'Native desktop app for music.',
        longDesc: 'I wanted to go beyond the browser and create a native Desktop application. This Music Player, built with Electron, allows the user to interact directly with the computer file system.',
        features: ['Import of Local Files', 'Play, Pause and Next Controls', 'Playlist Creation', 'Operating System Integration'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 7, slug: 'react-kanban', title: 'React Kanban', 
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Interactive board with drag-and-drop.',
        longDesc: 'I developed a complete Kanban board where the main feature is interactivity: the user can drag and drop tasks between columns.',
        features: ['Smooth Drag-and-Drop', 'CRUD via JSON-Server', 'Data Validation with Zod', 'Accessible Components'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 8, slug: 'api-leadmagnet', title: 'API Lead Magnet', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'Automação de campanhas de marketing.',
        longDesc: 'This API RESTful gerencia o ativo mais valioso de uma empresa: os leads. O sistema organiza campanhas e grupos, permitindo operações de CRUD otimizadas.',
        features: ['Captura e Gestão de Leads', 'Organização por Grupos de Campanha', 'Validação de Dados de Entrada', 'Alta Performance com Prisma'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 9, slug: 'api-library', title: 'Library Auth API', 
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'Library system focused on security.',
        longDesc: 'This project simulates the backend of a library. Passwords are never saved in plain text and access to sensitive routes is protected by JWT session tokens.',
        features: ['Password Encryption (Bcrypt)', 'Authentication via JWT Token', 'Loan Management', 'Unique Identifiers (UUID)'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library', deployLink: null, images: [], imageMobile: false, image: null
      },
      { 
        id: 10, slug: 'star-wars-catalog', title: 'Star Wars Catalog', 
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Spaceship catalog consuming a public API.',
        longDesc: 'This catalog explores the power of dynamic rendering and routing by consuming the public Star Wars API (SWAPI).',
        features: ['External API Consumption (SWAPI)', 'Asynchronous Data Handling', 'Category Navigation', 'Dynamic Item Details'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog', deployLink: null, images: [], imageMobile: false, image: null
      },
    ],
    contactPage: {
      title: "Get in Touch",
      subtitle: "Let's build something amazing together. Fill out the form or contact me on social media.",
      channels: "Contact Channels",
      form: { 
        nameLabel: "Name", namePlaceholder: "Your Name", emailLabel: "Email", emailPlaceholder: "Your Email", 
        messageLabel: "Message", messagePlaceholder: "Your Message", btn: "Send Message" 
      }
    }
  }
};