import { describe, it, expect } from 'vitest';
import { toolKey } from '../../src/lib/stack/tools';
import { TOOL_ICONS } from '../../src/components/stack/toolIcons';
import { resumeData } from '../../src/data/resume';

describe('toolKey', () => {
  it.each([
    ['Prisma ORM', 'prisma'],
    ['Prisma', 'prisma'],
    ['Next.js 16', 'next.js'],
    ['React 19', 'react'],
    ['Tailwind CSS v4', 'tailwindcss'],
    ['TailwindCSS', 'tailwindcss'],
    ['Swagger/OpenAPI', 'swagger'],
    ['Stripe (Checkout e Webhooks)', 'stripe'],
    ['API Gemini (IA generativa)', 'gemini'],
    ['Gemini API (generative AI)', 'gemini'],
    ['Google Gemini', 'gemini'],
    ['Shadcn/ui', 'shadcnui'],
    ['shadcn/ui', 'shadcnui'],
  ])('%s → %s', (name, key) => {
    expect(toolKey(name)).toBe(key);
  });
});

describe('logos', () => {
  it('as ferramentas com logo conhecido acham o ícone pela chave', () => {
    for (const name of ['Prisma ORM', 'Next.js', 'API Gemini (IA generativa)', 'Stripe (Checkout e Webhooks)', 'Three.js']) {
      expect(TOOL_ICONS[toolKey(name)]).toBeTypeOf('function');
    }
  });
});

describe('dados do Stack', () => {
  it.each(['pt', 'en'])('%s: 6 áreas com kanji e as mesmas ferramentas nos dois idiomas', (lang) => {
    const { categories } = resumeData[lang].techSection;
    expect(categories).toHaveLength(6);
    categories.forEach((cat, i) => {
      expect(cat.kanji).toMatch(/^\p{Script=Han}$/u);
      expect(cat.items).toHaveLength(resumeData.pt.techSection.categories[i].items.length);
    });
  });

  it('as ferramentas usadas neste site estão na lista', () => {
    const all = resumeData.pt.techSection.categories.flatMap((c) => c.items).map(toolKey);
    for (const tool of ['three.js', 'reactthreefiber', 'zustand', 'vitest']) {
      expect(all).toContain(tool);
    }
  });
});
