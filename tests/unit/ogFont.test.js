import { describe, it, expect, vi, afterEach } from 'vitest';
import { isFontData, loadMincho } from '../../src/lib/ogFont';

afterEach(() => vi.unstubAllGlobals());

describe('fonte das imagens de compartilhamento', () => {
  it('reconhece TrueType e OpenType e recusa uma página de erro', () => {
    expect(isFontData(new Uint8Array([0, 1, 0, 0, 9]).buffer)).toBe(true);
    expect(isFontData(new TextEncoder().encode('OTTOxx').buffer)).toBe(true);
    expect(isFontData(new TextEncoder().encode('<!DOCTYPE html>').buffer)).toBe(false);
    expect(isFontData(null)).toBe(false);
  });

  it('tenta de novo quando o Google devolve erro e desiste com uma exceção (o card cai na fonte padrão)', async () => {
    const fetchMock = vi.fn(async () => ({ ok: false, status: 429, text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadMincho('奥山', 800)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('não aceita HTML no lugar da fonte', async () => {
    const css = "@font-face { src: url(https://x/f.ttf) format('truetype'); }";
    vi.stubGlobal('fetch', vi.fn(async (url) => ({
      ok: true,
      status: 200,
      text: async () => css,
      arrayBuffer: async () => (String(url).endsWith('.ttf') ? new TextEncoder().encode('<html>').buffer : new ArrayBuffer(0)),
    })));
    await expect(loadMincho('奥山', 800)).rejects.toThrow('não devolveu uma fonte');
  });
});
