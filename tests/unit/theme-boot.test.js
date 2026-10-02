import { describe, it, expect } from 'vitest';
import { THEME_BOOT_SCRIPT, LANG_KEY } from '../../src/lib/themeBoot';
import { normalizeTheme } from '../../src/lib/palette';
import { VISITED_KEY } from '../../src/lib/loader';

// Executa o script com document/localStorage falsos e devolve o data-theme aplicado
function boot(stored, { blocked = false, visited = null, lang = null, browser = 'pt-BR' } = {}) {
  const attrs = {};
  const documentElement = { setAttribute: (k, v) => { attrs[k] = v; } };
  const document = { documentElement };
  const localStorage = {
    getItem: (key) => {
      if (blocked) throw new Error('storage bloqueado');
      if (key === VISITED_KEY) return visited;
      if (key === LANG_KEY) return lang;
      return stored;
    },
  };
  const navigator = { languages: [browser], language: browser };
  new Function('document', 'localStorage', 'navigator', THEME_BOOT_SCRIPT)(document, localStorage, navigator);
  return { ...attrs, lang: documentElement.lang };
}

const run = (stored, options) => boot(stored, options)['data-theme'];

describe('THEME_BOOT_SCRIPT', () => {
  it.each([null, 'day', 'light', 'night', 'dark', 'qualquer'])('valor salvo %s segue normalizeTheme', (stored) => {
    expect(run(stored)).toBe(normalizeTheme(stored));
  });

  it('storage bloqueado cai na noite', () => {
    expect(run('day', { blocked: true })).toBe('night');
  });

  it('quem já viu o ensō ganha data-visited', () => {
    expect(boot(null, { visited: '1' })).toHaveProperty('data-visited', '');
    expect(boot(null)).not.toHaveProperty('data-visited');
  });

  it.each([
    [{ browser: 'pt-BR' }, 'pt', 'pt-BR'],
    [{ browser: 'pt-PT' }, 'pt', 'pt-BR'],
    [{ browser: 'en-US' }, 'en', 'en'],
    [{ browser: 'ja-JP' }, 'en', 'en'],
    [{ browser: 'en-US', lang: 'pt' }, 'pt', 'pt-BR'],
    [{ browser: 'pt-BR', lang: 'en' }, 'en', 'en'],
  ])('idioma: %o → %s', (options, language, htmlLang) => {
    const attrs = boot(null, options);
    expect(attrs['data-language']).toBe(language);
    expect(attrs.lang).toBe(htmlLang);
  });

  it('storage bloqueado: português', () => {
    expect(boot(null, { blocked: true, browser: 'en-US' })['data-language']).toBe('pt');
  });
});
