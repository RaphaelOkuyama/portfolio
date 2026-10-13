import { describe, it, expect } from 'vitest';
import { isSoftwareRenderer } from '../../src/lib/webgl';

describe('renderizador por software', () => {
  it('reconhece o WebGL desenhado na CPU (sem aceleração de hardware)', () => {
    expect(isSoftwareRenderer('ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(true);
    expect(isSoftwareRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)')).toBe(true);
    expect(isSoftwareRenderer('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe(true);
  });

  it('não confunde placas de vídeo de verdade', () => {
    expect(isSoftwareRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 (0x00002D05) Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(false);
    expect(isSoftwareRenderer('ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(false);
    expect(isSoftwareRenderer('Apple M2')).toBe(false);
    expect(isSoftwareRenderer('')).toBe(false);
    expect(isSoftwareRenderer(undefined)).toBe(false);
  });
});
