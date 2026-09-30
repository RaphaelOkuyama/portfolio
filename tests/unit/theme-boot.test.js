import { describe, it, expect } from 'vitest';
import { THEME_BOOT_SCRIPT } from '../../src/lib/themeBoot';
import { normalizeTheme } from '../../src/lib/palette';

// Executa o script com document/localStorage falsos e devolve o data-theme aplicado
function run(stored, { blocked = false } = {}) {
  const attrs = {};
  const document = { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } };
  const localStorage = {
    getItem: () => {
      if (blocked) throw new Error('storage bloqueado');
      return stored;
    },
  };
  new Function('document', 'localStorage', THEME_BOOT_SCRIPT)(document, localStorage);
  return attrs['data-theme'];
}

describe('THEME_BOOT_SCRIPT', () => {
  it.each([null, 'day', 'light', 'night', 'dark', 'qualquer'])('valor salvo %s segue normalizeTheme', (stored) => {
    expect(run(stored)).toBe(normalizeTheme(stored));
  });

  it('storage bloqueado cai na noite', () => {
    expect(run('day', { blocked: true })).toBe('night');
  });
});
