// A stack de um projeto agrupada em camadas, para a lista parada da página do projeto (a faixa em
// movimento é bonita, mas não dá para ler). O que não estiver nas listas cai em "Ferramentas"
const BACK = [
  'Node.js', 'NestJS', 'Express', 'Fastify', 'Prisma', 'PostgreSQL', 'Sequelize', 'AdminJS', 'JWT', 'Bcrypt',
  'UUID', 'Better Auth', 'Stripe', 'Google Gemini', 'Swagger', 'Swagger/OpenAPI', 'Zod', 'json-server',
];
const TOOLS = ['Jest', 'Playwright', 'Supertest', 'Docker', 'Vite', 'Orval', 'Electron'];

export const STACK_LAYERS = ['front', 'back', 'tools'];

// Linguagens contam na camada em que o projeto as usa: sozinhas num projeto de back, vão para back
const LANGUAGES = ['TypeScript', 'JavaScript'];

export function layerOf(tech) {
  if (BACK.includes(tech)) return 'back';
  if (TOOLS.includes(tech)) return 'tools';
  return 'front';
}

export function groupStack(stack, type) {
  const groups = Object.fromEntries(STACK_LAYERS.map((layer) => [layer, []]));
  stack.forEach((tech) => {
    const layer = LANGUAGES.includes(tech) && type === 'back' ? 'back' : layerOf(tech);
    groups[layer].push(tech);
  });
  return STACK_LAYERS.filter((layer) => groups[layer].length).map((layer) => ({ layer, items: groups[layer] }));
}
