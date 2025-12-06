# 🌐 Portfólio Profissional - Raphael Okuyama

Bem-vindo ao repositório oficial do meu **Portfólio Profissional**. Este projeto foi desenvolvido para apresentar minha jornada como **Desenvolvedor Full-Stack**, exibindo meus projetos, certificações e experiências profissionais através de uma interface moderna, interativa e totalmente responsiva.

🔗 **Acesse online:** [portfolio-raphael.vercel.app](https://portfolio-raphael-okuyama.vercel.app)

## 📝 Descrição

Este projeto é uma **Single Page Application (SPA)** construída com **Next.js 14 (App Router)**. O foco principal foi criar uma experiência de usuário imersiva e fluida, demonstrando domínio não apenas em código, mas em Design e UX.

A aplicação conta com um sistema próprio de internacionalização (i18n), alternância de temas (Claro/Escuro) e animações avançadas, tudo gerenciado via **Context API** e **Framer Motion**, sem depender de bibliotecas pesadas de tradução ou UI.

## ✨ Funcionalidades

### **Experiência do Usuário (UX/UI)**
- **Cursor Personalizado**: Um cursor interativo que reage a elementos clicáveis, proporcionando uma navegação única.
- **Fundo de Partículas**: Animação de fundo (WebGL) que responde ao movimento do mouse e se adapta às cores do tema.
- **Tema Claro/Escuro**: Sistema robusto de temas com persistência no `localStorage` e transições suaves de cores.
- **Internacionalização (PT/EN)**: Suporte completo a Português e Inglês, alternando todo o conteúdo (textos, projetos e certificados) instantaneamente.

### **Seções Dinâmicas**
- **Projetos com Rotas Dinâmicas**: Cada projeto possui uma página de detalhes (`slug`), gerada automaticamente a partir de um arquivo de dados centralizado.
- **Linha do Tempo Interativa**: Seção de experiência profissional com layout responsivo que se adapta de zigue-zague (desktop) para lista (mobile).
- **Certificados**: Galeria de cursos com ícones dinâmicos baseados na tecnologia estudada.

### **Backend & Integrações**
- **Formulário de Contato**: Envio real de e-mails utilizando **Nodemailer** via API Routes do Next.js (Serverless).
- **SEO Otimizado**: Estrutura semântica e metadados configurados para melhor indexação.

## 🛠️ Tecnologias Usadas

### Core
- ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) **Next.js 14** – Framework React para produção com App Router.
- ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) **React** – Biblioteca para construção de interfaces.
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) **JavaScript (ES6+)** – Lógica e interatividade.

### Estilização e Animação
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) **CSS Modules / Global** – Estilização responsiva com variáveis CSS para temas.
- ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white) **Framer Motion** – Biblioteca poderosa para animações complexas e transições de página.
- **OGL** – Biblioteca WebGL leve para o efeito de partículas no fundo.

### Backend e Ferramentas
- ![Nodemailer](https://img.shields.io/badge/Nodemailer-339933?style=for-the-badge&logo=nodemailer&logoColor=white) **Nodemailer** – Envio de e-mails transacionais.
- ![Lucide React](https://img.shields.io/badge/Lucide_Icons-F78166?style=for-the-badge&logo=lucide&logoColor=white) **Lucide & React Icons** – Bibliotecas de ícones vetoriais.

## 🗂️ Estrutura de Pastas

```bash
portfolio/
├─ public/                  # Arquivos estáticos (imagens, currículo, favicon)
├─ src/
│  ├─ app/                  # Rotas do Next.js (App Router)
│  │  ├─ api/               # API Routes (envio de email)
│  │  ├─ projects/[slug]/   # Páginas dinâmicas de projetos
│  │  ├─ globals.css        # Estilos globais e variáveis de tema
│  │  └─ layout.js          # Layout principal (Navbar, Footer, Providers)
│  ├─ components/           # Componentes reutilizáveis (Navbar, Cursor, Cards)
│  ├─ context/              # Context API (Tema e Idioma)
│  └─ data/                 # Arquivo resume.js (Dados centralizados do portfólio)
├─ .env.local               # Variáveis de ambiente (não versionado)
├─ .gitignore               # Arquivos ignorados pelo Git
├─ package.json             # Dependências e scripts
└─ README.md                # Documentação do projeto
```

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos

  * **Node.js** (versão 18+ recomendada)
  * **npm** ou **yarn**
  * Conta de e-mail (Gmail) com "Senha de App" configurada (para o formulário de contato).

### Passos para execução

1.  **Clonar o repositório**

    ```bash
    git clone [https://github.com/RaphaelOkuyama/portfolio.git](https://github.com/RaphaelOkuyama/portfolio.git)
    cd portfolio
    ```

2.  **Instalar as dependências**

    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente**
    Crie um arquivo `.env.local` na raiz do projeto e adicione suas credenciais para o envio de e-mail:

    ```env
    EMAIL_USER=seuemail@gmail.com
    EMAIL_PASS=sua_senha_de_aplicativo_google
    ```

4.  **Rodar o servidor de desenvolvimento**

    ```bash
    npm run dev
    ```

    O projeto estará disponível em: `http://localhost:3000`

## 📦 Scripts Disponíveis

  * `npm run dev` – Inicia o servidor em modo de desenvolvimento.
  * `npm run build` – Cria a versão otimizada para produção.
  * `npm start` – Inicia o servidor de produção.
  * `npm run lint` – Executa a verificação de código (ESLint).

## 🤝 Contribuições

Este é um projeto pessoal, mas sugestões e feedbacks são sempre bem-vindos\! Sinta-se à vontade para abrir uma issue ou entrar em contato.

## 📄 Licença

Este projeto está licenciado sob a **MIT License**. Consulte o arquivo [LICENSE](https://www.google.com/search?q=./LICENSE) para mais detalhes.

-----

Copyright © 2025 **Raphael Okuyama**