// Chave canônica de uma ferramenta do Stack, usada para achar o logo dela (toolIcons.js).
// Os nomes variam ("Prisma ORM", "Next.js 16", "API Gemini (IA generativa)"), a chave não.

// Grafias diferentes da mesma ferramenta → uma chave só
const ALIASES = {
  prismaorm: 'prisma',
  'swagger/openapi': 'swagger',
  apigemini: 'gemini',
  geminiapi: 'gemini',
  googlegemini: 'gemini',
  'shadcn/ui': 'shadcnui',
  githubactions: 'githubactions',
  r3f: 'reactthreefiber',
};

export function toolKey(name) {
  const base = String(name)
    .toLowerCase()
    // "(Checkout e Webhooks)", "(IA generativa)"
    .replace(/\(.*?\)/g, '')
    // versões no fim: "Next.js 16", "Tailwind CSS v4", "React 19"
    .replace(/\s+v?\d+(\.\d+)*\s*$/, '')
    .replace(/\s+/g, '')
    .trim();
  return ALIASES[base] ?? base;
}
