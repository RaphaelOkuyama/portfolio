import { Award, BookOpen } from 'lucide-react';

export const resumeData = {
  pt: {
    nav: { 
      home: "Home", 
      projects: "Projetos", 
      certificates: "Certificados", 
      contact: "Contato" 
    },
    footer: { 
      rights: "Todos os direitos reservados." 
    },
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
        { name: "Linguagens", items: ["JavaScript", "TypeScript", "Python"] },
        { name: "Frontend", items: ["React", "Next.js", "HTML5", "CSS3", "Sass", "Bootstrap"] },
        { name: "Backend", items: ["Node.js", "Express.js", "Prisma", "Sequelize"] },
        { name: "Banco de Dados", items: ["PostgreSQL", "MongoDB"] },
        { name: "DevOps", items: ["Git", "GitHub"] },
        { name: "Ferramentas", items: ["VS Code", "Insomnia", "Postman", "Vite", "Beekeeper"] }
      ]
    },
    experienceTitle: "Experiência Profissional",
    experience: [
      {
        id: 1,
        year: 'Abr 2022 - Fev 2025',
        role: 'Tecnologia da Informação',
        company: 'Supermercado Mairinque',
        desc: 'Atuação ampla passando por Suporte ao Cliente, Análise de Dados (coleta e relatórios) e Gestão de TI (sistemas e redes).'
      },
      {
        id: 2,
        year: 'Fev 2025 - Atual',
        role: 'Estágio de TI',
        company: 'Prefeitura de Mairinque',
        desc: 'Gestão de sistemas, manutenção de redes e computadores, suporte técnico e desenvolvimento de soluções tecnológicas.'
      },
      {
        id: 3,
        year: 'Atualmente',
        role: 'Programador Full-Stack',
        company: 'Disponível para Oportunidades',
        desc: 'Profissional aberto a novas oportunidades no mercado de desenvolvimento de software. Com sólida base acadêmica e portfólio prático, estou preparado para integrar equipes ágeis e contribuir com código limpo, soluções eficientes e inovação técnica em projetos desafiadores.'
      }
    ],
    certificatesPage: { 
      title: "Certificados & Cursos", 
      subtitle: "Em constante expansão de conhecimento e sempre aprendendo novas tecnologias.",
      btnView: "Ver Certificado"
    },
    certificates: [
      // 1. FRAMEWORKS E AVANÇADOS
      { id: 1, name: "Curso de NextJS", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1I7Jr9McP_IQKRmEDMO2j2A3WGVGGT77e/view?usp=sharing" },
      { id: 2, name: "SQL no NodeJS e Prisma ORM", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1X9EpEiLNA7LZc08FDdAZXLUlyt4jxBl7/view?usp=sharing" },
      { id: 3, name: "NodeJS em Aplicações Web", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1YBDj_Hz9bAF7C5Z9ZYs8T3DeVdFNsWi2/view?usp=sharing" },
      { id: 4, name: "Curso de NodeJS", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1jMbrhElEAFEOHY5ph5wtRQOCDQSz74mE/view?usp=sharing" },
      { id: 5, name: "Curso de Banco de Dados SQL", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1Wob8BdSy3bIvIGk_is74AgBpmS9hNsew/view?usp=sharing" },
      { id: 6, name: "Curso de React", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/143jdZvzdgUTiT0R6_V_ZCymxu0Is5Vpt/view?usp=sharing" },
      { id: 7, name: "CSS Moderno", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1Q6N1BaPZFOH0ECOJie2FTGjGQDOLCUNA/view?usp=sharing" },
      { id: 8, name: "Bootstrap e SASS", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1_PgBGaWfj5Eqh9I80gETuPDQUgF1C5Ri/view?usp=sharing" },
      { id: 9, name: "Git e GitHub", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/16SjZpNj47YW_ceOeEWhM81rBJyYWd5Vt/view?usp=sharing" },
      { id: 10, name: "Curso de TypeScript", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/149wMZ6nlMpb_ZZSry_ghUJFeCUi7Gblf/view?usp=sharing" },
      
      // 2. JAVASCRIPT (Ordem Decrescente VI -> I)
      { id: 11, name: "JavaScript VI", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1V0vWxi38c02czMZz9MdrYeQfmySThWgq/view?usp=sharing" },
      { id: 12, name: "JavaScript V", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1fgRLJXx3DUgjQTHKmV4X17mtBmr90RhV/view?usp=sharing" },
      { id: 13, name: "JavaScript IV", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1pbuD3XndCasiNHj19GhzltGbI3P7pUoN/view?usp=sharing" },
      { id: 14, name: "JavaScript III", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1l6zWN9JktClgEZkRvMaK_36A4U9mxu0A/view?usp=sharing" },
      { id: 15, name: "JavaScript II", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1Z5Jhrd9rvUtMd7tCh-VC1TYonAwHzeLC/view?usp=sharing" },
      { id: 16, name: "JavaScript I", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1J3Pdmk_8pK1hA7Cd4devshM-shOnq-6w/view?usp=sharing" },
      
      // 3. BASE (HTML/CSS por último)
      { id: 17, name: "Curso de CSS3", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1V-AgaPuW-leQy-qSWsBmzcXM3DC7oMht/view?usp=sharing" },
      { id: 18, name: "Curso de HTML5", institution: "OneBitCode", status: "Concluído", link: "https://drive.google.com/file/d/1hCZmPBx-J6WAThP4KQ9ITreUmMPJDbdQ/view?usp=sharing" }
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
        id: 1, 
        slug: 'devflix-frontend',
        title: 'DevFlix Frontend', 
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'Plataforma EAD inspirada na Netflix.',
        longDesc: 'O objetivo deste projeto foi criar uma plataforma de ensino a distância (EAD) com uma experiência visual imersiva, inspirada na Netflix. Desenvolvido com Next.js e TypeScript, o foco foi entregar uma navegação fluida e responsiva, permitindo que os alunos acessem seus cursos favoritos e assistam às aulas em um ambiente moderno e intuitivo.',
        features: ['Interface Responsiva (Mobile First)', 'Server-Side Rendering para Performance', 'Consumo de API REST com Axios', 'Estilização Modular com SASS'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend',
        deployLink: null, image: null
      },
      { 
        id: 2, 
        slug: 'devflix-backend',
        title: 'DevFlix API', 
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT'], 
        shortDesc: 'API completa para gestão de streaming.',
        longDesc: 'Este é o motor da plataforma DevFlix. O desafio foi construir uma API robusta que gerenciasse não apenas o catálogo de cursos e episódios, mas também a autenticação segura e o progresso dos alunos. Utilizei Sequelize para modelar relacionamentos complexos no banco de dados PostgreSQL, garantindo integridade e eficiência nas consultas.',
        features: ['Autenticação Segura (JWT)', 'Gestão de Categorias e Favoritos', 'Controle de Visualizações', 'Modelagem de Dados Relacional'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend',
        deployLink: null, image: null
      },
      { 
        id: 3, 
        slug: 'player-electron',
        title: 'Music Player Desktop', 
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'App desktop nativo para músicas.',
        longDesc: 'Quis ultrapassar as barreiras do navegador e criar uma aplicação Desktop nativa. Este Music Player, construído com Electron, permite que o usuário interaja diretamente com o sistema de arquivos do computador para importar suas músicas, criar playlists personalizadas e controlar a reprodução, tudo com uma interface web moderna.',
        features: ['Importação de Arquivos Locais', 'Controle de Play, Pause e Próximo', 'Criação de Playlists', 'Integração com Sistema Operacional'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron',
        deployLink: null, image: null
      },
      { 
        id: 4, 
        slug: 'react-kanban',
        title: 'React Kanban', 
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Quadro interativo com Drag-and-Drop.',
        longDesc: 'A produtividade visual foi o foco deste projeto. Desenvolvi um quadro Kanban completo onde a principal funcionalidade é a interatividade: o usuário pode arrastar e soltar tarefas entre colunas (To-Do, In Progress, Done). Utilizei Zod para garantir que os dados das tarefas sejam sempre válidos e Radix UI para acessibilidade.',
        features: ['Drag-and-Drop Fluido', 'CRUD via JSON-Server', 'Validação de Dados com Zod', 'Componentes Acessíveis'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban',
        deployLink: null, image: null
      },
      { 
        id: 5, 
        slug: 'api-ecommerce',
        title: 'API E-commerce', 
        stack: ['Node.js', 'Express', 'PostgreSQL', 'JavaScript', 'pg'], 
        shortDesc: 'Backend para gestão de vendas.',
        longDesc: 'Em um sistema de vendas, a precisão dos dados é vital. Criei este backend para gerenciar todo o fluxo de um e-commerce: desde o cadastro de produtos e clientes até a efetivação de pedidos. O foco foi implementar operações CRUD seguras e garantir que o estoque seja atualizado corretamente a cada venda.',
        features: ['Controle de Estoque em Tempo Real', 'Gestão de Clientes e Pedidos', 'Transações no Banco de Dados', 'Integridade Referencial'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-ecommerce',
        deployLink: null, image: null
      },
      { 
        id: 6, 
        slug: 'react-stock',
        title: 'React Stock Manager', 
        stack: ['React', 'Vite', 'JavaScript'], 
        shortDesc: 'Dashboard SPA para estoque.',
        longDesc: 'Uma Single Page Application (SPA) projetada para facilitar a gestão de inventário. O diferencial aqui é a experiência do usuário: um dashboard visual exibe métricas vitais como "itens acabando" e "total em estoque", permitindo que o gestor tome decisões rápidas sem recarregar a página.',
        features: ['Dashboard com Métricas Visuais', 'Cálculo Automático de Estoque Baixo', 'Persistência no LocalStorage', 'Navegação SPA Rápida'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-stock',
        deployLink: null, image: null
      },
      { 
        id: 7, 
        slug: 'api-leadmagnet',
        title: 'API Lead Magnet', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'Automação de campanhas de marketing.',
        longDesc: 'Desenvolvida para o setor de marketing, esta API RESTful gerencia o ativo mais valioso de uma empresa: os leads. O sistema organiza campanhas e grupos, permitindo operações de CRUD otimizadas. A escolha do Prisma ORM acelerou o desenvolvimento e garantiu uma comunicação type-safe com o banco de dados.',
        features: ['Captura e Gestão de Leads', 'Organização por Grupos de Campanha', 'Validação de Dados de Entrada', 'Alta Performance com Prisma'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet',
        deployLink: null, image: null
      },
      { 
        id: 8, 
        slug: 'api-task-typescript',
        title: 'Task Manager API', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Zod'], 
        shortDesc: 'Gestão de tarefas com tipagem forte.',
        longDesc: 'A confiabilidade foi o pilar deste projeto. Ao construir esta API de gerenciamento de tarefas, utilizei TypeScript e Zod para criar uma barreira de segurança contra dados incorretos. Cada requisição é validada e tratada, garantindo que o sistema seja previsível e fácil de manter.',
        features: ['Validação Rigorosa com Zod', 'Tipagem Estática Completa', 'Tratamento de Erros Centralizado', 'Arquitetura Limpa e Organizada'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-task-typescript-express',
        deployLink: null, image: null
      },
      { 
        id: 9, 
        slug: 'todo-list-mongodb',
        title: 'Fullstack ToDo Mongo', 
        stack: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'EJS', 'Bulma'], 
        shortDesc: 'App Fullstack com banco NoSQL.',
        longDesc: 'Para explorar o mundo NoSQL, desenvolvi esta aplicação Fullstack utilizando MongoDB. Diferente dos bancos relacionais, aqui trabalhei com documentos flexíveis. O frontend é renderizado no servidor (SSR) usando EJS e estilizado com Bulma, resultando em uma aplicação leve e funcional.',
        features: ['NoSQL Database (MongoDB)', 'Renderização Server-Side (EJS)', 'Interface Moderna (Bulma CSS)', 'CRUD de Checklists Aninhadas'],
        repoLink: 'https://github.com/RaphaelOkuyama/todo-list-mongodb',
        deployLink: null, image: null
      },
      { 
        id: 10, 
        slug: 'api-library',
        title: 'Library Auth API', 
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'Sistema de livraria focado em segurança.',
        longDesc: 'Este projeto simula o backend de uma biblioteca, mas o verdadeiro foco é a Segurança da Informação. Implementei um sistema robusto de autenticação onde senhas nunca são salvas em texto puro (hash com Bcrypt) e o acesso às rotas sensíveis (como empréstimos) é protegido por tokens de sessão (JWT), garantindo controle total de acesso.',
        features: ['Criptografia de Senhas (Bcrypt)', 'Autenticação via Token JWT', 'Gerenciamento de Empréstimos', 'Identificadores Únicos (UUID)'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library',
        deployLink: null, image: null
      },
      { 
        id: 11, 
        slug: 'devhub',
        title: 'DevHub Social', 
        stack: ['HTML', 'Sass', 'Bootstrap', 'JavaScript', 'Vite'], 
        shortDesc: 'Interface de rede social responsiva.',
        longDesc: 'O foco deste projeto foi dominar a construção de interfaces responsivas e visualmente ricas. Criei uma simulação de rede social utilizando Bootstrap e SASS para garantir um layout adaptável a qualquer dispositivo. Implementei funcionalidades interativas como alternância de tema (Claro/Escuro) e modais para criação de posts, demonstrando controle sobre componentes de UI modernos.',
        features: ['Design Responsivo (Bootstrap Grid)', 'Estilização Avançada com SASS', 'Modais e Carrosséis Interativos', 'Tema Claro/Escuro Dinâmico'],
        repoLink: 'https://github.com/RaphaelOkuyama/devhub',
        deployLink: null, image: null
      },
      { 
        id: 12, 
        slug: 'star-wars-catalog',
        title: 'Star Wars Catalog', 
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Catálogo de naves consumindo API.',
        longDesc: 'Uma imersão no ecossistema Next.js. Este catálogo explora o poder da renderização dinâmica e do roteamento do framework. Ao consumir a API pública do Star Wars (SWAPI), a aplicação trata dados assíncronos e gera páginas individuais para cada espaçonave automaticamente. O projeto foca em performance e na organização de dados complexos em uma interface limpa.',
        features: ['Consumo de API Externa', 'Tratamento de Dados Assíncronos', 'Categoria Navigation', 'Detalhes Dinâmicos de Itens'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog',
        deployLink: null, image: null
      }
    ],
    contactPage: {
      title: "Entre em Contato",
      subtitle: "Vamos construir algo incrível juntos. Preencha o formulário ou me chame nas redes.",
      channels: "Canais de Contato",
      form: { 
        nameLabel: "Nome", 
        namePlaceholder: "Seu Nome", 
        emailLabel: "Email", 
        emailPlaceholder: "Seu Email", 
        messageLabel: "Mensagem", 
        messagePlaceholder: "Sua Mensagem", 
        btn: "Enviar Mensagem" 
      }
    }
  },
  en: {
    nav: { 
      home: "Home", 
      projects: "Projects", 
      certificates: "Certificates", 
      contact: "Contact" 
    },
    footer: { 
      rights: "All rights reserved." 
    },
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
        { name: "Languages", items: ["JavaScript", "TypeScript", "Python"] },
        { name: "Frontend", items: ["React", "Next.js", "HTML5", "CSS3", "Sass", "Bootstrap"] },
        { name: "Backend", items: ["Node.js", "Express.js", "Prisma", "Sequelize"] },
        { name: "Databases", items: ["PostgreSQL", "MongoDB"] },
        { name: "DevOps", items: ["Git", "GitHub"] },
        { name: "Tools", items: ["VS Code", "Insomnia", "Postman", "Vite", "Beekeeper"] }
      ]
    },
    experienceTitle: "Professional Experience",
    experience: [
      { id: 1, year: 'Apr 2022 - Feb 2025', role: 'IT Specialist', company: 'Mairinque Supermarket', desc: 'Broad role covering Customer Support, Data Analysis (collection and reporting), and IT Management (systems and networks).' },
      { id: 2, year: 'Feb 2025 - Present', role: 'IT Intern', company: 'Mairinque City Hall', desc: 'Systems management, network/computer maintenance, technical support, and tech solutions development.' },
      { id: 3, year: 'Currently', role: 'Full-Stack Programmer', company: 'Open to Opportunities',
        desc: 'Professional open to new opportunities in the software development market. With a solid academic foundation and a practical portfolio, I am ready to join agile teams and contribute with clean code, efficient solutions, and technical innovation in challenging projects.'
      }
    ],
    certificatesPage: { 
      title: "Certificates & Courses", 
      subtitle: "Constantly expanding knowledge and always learning new technologies.",
      btnView: "View Certificate"
    },
    certificates: [
      { id: 1, name: "NextJS Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1I7Jr9McP_IQKRmEDMO2j2A3WGVGGT77e/view?usp=sharing" },
      { id: 2, name: "SQL in NodeJS & Prisma ORM", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1X9EpEiLNA7LZc08FDdAZXLUlyt4jxBl7/view?usp=sharing" },
      { id: 3, name: "NodeJS in Web Apps", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1YBDj_Hz9bAF7C5Z9ZYs8T3DeVdFNsWi2/view?usp=sharing" },
      { id: 4, name: "NodeJS Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1jMbrhElEAFEOHY5ph5wtRQOCDQSz74mE/view?usp=sharing" },
      { id: 5, name: "SQL Database Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1Wob8BdSy3bIvIGk_is74AgBpmS9hNsew/view?usp=sharing" },
      { id: 6, name: "React Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/143jdZvzdgUTiT0R6_V_ZCymxu0Is5Vpt/view?usp=sharing" },
      { id: 7, name: "Modern CSS", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1Q6N1BaPZFOH0ECOJie2FTGjGQDOLCUNA/view?usp=sharing" },
      { id: 8, name: "Bootstrap & SASS", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1_PgBGaWfj5Eqh9I80gETuPDQUgF1C5Ri/view?usp=sharing" },
      { id: 9, name: "Git & GitHub", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/16SjZpNj47YW_ceOeEWhM81rBJyYWd5Vt/view?usp=sharing" },
      { id: 10, name: "TypeScript Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/149wMZ6nlMpb_ZZSry_ghUJFeCUi7Gblf/view?usp=sharing" },
      { id: 11, name: "JavaScript VI", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1V0vWxi38c02czMZz9MdrYeQfmySThWgq/view?usp=sharing" },
      { id: 12, name: "JavaScript V", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1fgRLJXx3DUgjQTHKmV4X17mtBmr90RhV/view?usp=sharing" },
      { id: 13, name: "JavaScript IV", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1pbuD3XndCasiNHj19GhzltGbI3P7pUoN/view?usp=sharing" },
      { id: 14, name: "JavaScript III", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1l6zWN9JktClgEZkRvMaK_36A4U9mxu0A/view?usp=sharing" },
      { id: 15, name: "JavaScript II", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1Z5Jhrd9rvUtMd7tCh-VC1TYonAwHzeLC/view?usp=sharing" },
      { id: 16, name: "JavaScript I", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1J3Pdmk_8pK1hA7Cd4devshM-shOnq-6w/view?usp=sharing" },
      { id: 17, name: "CSS3 Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1V-AgaPuW-leQy-qSWsBmzcXM3DC7oMht/view?usp=sharing" },
      { id: 18, name: "HTML5 Course", institution: "OneBitCode", status: "Completed", link: "https://drive.google.com/file/d/1hCZmPBx-J6WAThP4KQ9ITreUmMPJDbdQ/view?usp=sharing" }
    ],
    projectsPage: { 
      title: "My Projects", 
      subtitle: "Highlight of some developed projects. To explore more repositories, visit my GitHub profile.",
      btnDetails: "View Details",
      btnCode: "View on GitHub",
      btnDeploy: "Live Demo",
      techs: "Technologies Used",
      features: "Key Features",
      aboutProject: "About the Project",
      projectImage: "Project Image",
      loadingText: "Loading project...",
      btnBack: "Back"
    },
    // --- TOP 12 PROJECTS (EN - Storytelling Traduzido) ---
    projects: [
      { 
        id: 1, 
        slug: 'devflix-frontend',
        title: 'DevFlix Frontend', 
        stack: ['Next.js', 'React', 'TypeScript', 'Sass', 'Bootstrap', 'Axios', 'SWR'], 
        shortDesc: 'Immersive Netflix-style e-learning platform.',
        longDesc: 'The goal was to create a learning experience as engaging as watching a movie. Built with Next.js and TypeScript, the frontend uses SWR to keep data (like course progress and favorites) always synchronized without page reloads. The responsive interface, built with Reactstrap and SASS, features interactive carousels and a robust video player.',
        features: ['Responsive Interface (Mobile First)', 'Server-Side Rendering for Performance', 'REST API Consumption with Axios', 'Modular Styling with SASS'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-frontend',
        deployLink: null, image: null
      },
      { 
        id: 2, 
        slug: 'devflix-backend',
        title: 'DevFlix API', 
        stack: ['Node.js', 'Express', 'Sequelize', 'PostgreSQL', 'AdminJS', 'JWT', 'Bcrypt'], 
        shortDesc: 'Robust backend with admin dashboard.',
        longDesc: 'The heart of DevFlix. More than just serving data, this backend manages the entire platform ecosystem. I implemented a secure authentication system using JWT and Bcrypt, episode streaming control, and user progress tracking. A key feature is the AdminJS integration, which automatically generates a complete admin dashboard for managing courses, categories, and users.',
        features: ['Automatic Admin Panel (AdminJS)', 'Secure Auth (JWT/Bcrypt)', 'Route Pagination', 'Progress & Favorites Tracking'],
        repoLink: 'https://github.com/RaphaelOkuyama/devflix-backend',
        deployLink: null, image: null
      },
      { 
        id: 3, 
        slug: 'player-electron',
        title: 'Music Player Desktop', 
        stack: ['Electron', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'JavaScript'], 
        shortDesc: 'Native desktop application for music.',
        longDesc: 'I wanted to push beyond the browser and create a native Desktop application. This Music Player, built with Electron, allows the user to interact directly with the computer\'s file system to import songs, create custom playlists, and control playback, all within a modern web interface.',
        features: ['Local File Import', 'Play, Pause, and Skip Controls', 'Playlist Creation', 'OS Integration'],
        repoLink: 'https://github.com/RaphaelOkuyama/player-electron',
        deployLink: null, image: null
      },
      { 
        id: 4, 
        slug: 'react-kanban',
        title: 'React Kanban', 
        stack: ['React', 'TypeScript', 'Vite', 'Radix UI', 'Zod', 'json-server'], 
        shortDesc: 'Interactive board with Drag-and-Drop.',
        longDesc: 'Visual productivity was the focus of this project. I developed a complete Kanban board where the main functionality is interactivity: the user can drag and drop tasks between columns (To-Do, In Progress, Done). I used Zod to ensure task data is always valid and Radix UI for accessibility.',
        features: ['Fluid Drag-and-Drop', 'CRUD via JSON-Server', 'Data Validation with Zod', 'Accessible Components'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-kanban',
        deployLink: null, image: null
      },
      { 
        id: 5, 
        slug: 'api-ecommerce',
        title: 'E-commerce API', 
        stack: ['Node.js', 'Express', 'PostgreSQL', 'JavaScript', 'pg'], 
        shortDesc: 'Backend for sales management.',
        longDesc: 'In a sales system, data accuracy is vital. I created this backend to manage the entire flow of an e-commerce store: from product and customer registration to order placement. The focus was on implementing secure CRUD operations and ensuring inventory is correctly updated with every sale.',
        features: ['Real-Time Inventory Control', 'Customer and Order Management', 'Database Transactions', 'Referential Integrity'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-ecommerce',
        deployLink: null, image: null
      },
      { 
        id: 6, 
        slug: 'react-stock',
        title: 'React Stock Manager', 
        stack: ['React', 'Vite', 'JavaScript'], 
        shortDesc: 'SPA Dashboard for inventory.',
        longDesc: 'A Single Page Application (SPA) designed to streamline inventory management. The differentiator here is the user experience: a visual dashboard displays vital metrics like "low stock items" and "total inventory", allowing the manager to make quick decisions without reloading the page.',
        features: ['Dashboard with Visual Metrics', 'Automatic Low Stock Calculation', 'LocalStorage Persistence', 'Fast SPA Navigation'],
        repoLink: 'https://github.com/RaphaelOkuyama/react-stock',
        deployLink: null, image: null
      },
      { 
        id: 7, 
        slug: 'api-leadmagnet',
        title: 'Lead Magnet API', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod'], 
        shortDesc: 'Marketing campaign automation.',
        longDesc: 'Developed for the marketing sector, this RESTful API manages a company\'s most valuable asset: leads. The system organizes campaigns and groups, allowing optimized CRUD operations. The choice of Prisma ORM accelerated development and ensured type-safe communication with the database.',
        features: ['Lead Capture and Management', 'Campaign Group Organization', 'Input Data Validation', 'High Performance with Prisma'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-leadmagnet',
        deployLink: null, image: null
      },
      { 
        id: 8, 
        slug: 'api-task-typescript',
        title: 'Task Manager API', 
        stack: ['Node.js', 'Express', 'TypeScript', 'Zod'], 
        shortDesc: 'RESTful API with validation and error handling.',
        longDesc: 'Reliability and standardization were the pillars of this project. I built a task management API focused on software engineering best practices: strict static typing with TypeScript, input data validation with Zod, and a centralized error handling system, resulting in clean and predictable code.',
        features: ['Strict Validation with Zod', 'Full Static Typing', 'Centralized Error Handling', 'Clean Architecture'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-task-typescript-express',
        deployLink: null, image: null
      },
      { 
        id: 9, 
        slug: 'todo-list-mongodb',
        title: 'Fullstack ToDo Mongo', 
        stack: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'EJS', 'Bulma'], 
        shortDesc: 'Fullstack App with NoSQL database.',
        longDesc: 'To explore the NoSQL world, I developed this Fullstack application using MongoDB. Unlike relational databases, here I worked with flexible documents. The frontend is rendered on the server (SSR) using EJS and styled with Bulma, resulting in a lightweight and functional application.',
        features: ['NoSQL Database (MongoDB)', 'Server-Side Rendering (EJS)', 'Modern Interface (Bulma CSS)', 'Dynamic Checklists'],
        repoLink: 'https://github.com/RaphaelOkuyama/todo-list-mongodb',
        deployLink: null, image: null
      },
      { 
        id: 10, 
        slug: 'api-library',
        title: 'Library Auth API', 
        stack: ['Node.js', 'Express', 'JavaScript', 'JWT', 'Bcrypt', 'UUID'], 
        shortDesc: 'Library system focused on security.',
        longDesc: 'This project simulates a library backend, but the true focus is Information Security. I implemented a robust authentication system where passwords are never saved in plain text (Bcrypt) and route access is protected by session tokens (JWT), ensuring only authorized users manage loans.',
        features: ['Password Encryption (Bcrypt)', 'Authentication via JWT Token', 'Loan Management', 'Unique Identifiers (UUID)'],
        repoLink: 'https://github.com/RaphaelOkuyama/api-library',
        deployLink: null, image: null
      },
      { 
        id: 11, 
        slug: 'devhub',
        title: 'DevHub Social', 
        stack: ['HTML', 'Sass', 'Bootstrap', 'JavaScript', 'Vite'], 
        shortDesc: 'Social network interface for devs.',
        longDesc: 'Focused purely on Frontend, DevHub is a responsive social network interface. The challenge was to use SASS and Bootstrap to create a complex layout, with post modals and image carousels, ensuring a perfect experience on both desktop and mobile.',
        features: ['Fully Responsive Design', 'Advanced Styling with SASS', 'Interactive Modals and Carousels', 'Optimized Build with Vite'],
        repoLink: 'https://github.com/RaphaelOkuyama/devhub',
        deployLink: null, image: null
      },
      { 
        id: 12, 
        slug: 'star-wars-catalog',
        title: 'Star Wars Catalog', 
        stack: ['Next.js', 'React', 'TypeScript', 'CSS3'], 
        shortDesc: 'Spaceship catalog consuming API.',
        longDesc: 'An immersion into the Star Wars universe through data. This application consumes the SWAPI (public API) to display a detailed spaceship catalog. The focus was on handling asynchronous data, implementing pagination, and displaying information dynamically utilizing the power of Next.js.',
        features: ['External API Consumption', 'Asynchronous Data Handling', 'Category Navigation', 'Dynamic Item Details'],
        repoLink: 'https://github.com/RaphaelOkuyama/star-wars-spaceships-catalog',
        deployLink: null, image: null
      }
    ],
    contactPage: {
      title: "Get in Touch",
      subtitle: "Let's build something amazing together. Fill out the form or reach out on social media.",
      channels: "Contact Channels",
      form: { 
        nameLabel: "Name", 
        namePlaceholder: "Your Name", 
        emailLabel: "Email", 
        emailPlaceholder: "Your Email", 
        messageLabel: "Message", 
        messagePlaceholder: "Your Message", 
        btn: "Send Message" 
      }
    }
  }
};