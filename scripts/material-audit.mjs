// Materiais compartilhados por objetos com "assinaturas" de programa diferentes (instanciado,
// cor por instância, cor por vértice rgb/rgba, morph): o three troca de programa a cada desenho
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3100/?perf');
await page.waitForFunction(() => window.__r3f, null, { timeout: 30000 });
await page.waitForTimeout(3000);
const out = await page.evaluate(() => {
  const { scene, gl } = window.__r3f;
  const byMat = new Map();
  scene.traverse((o) => {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      const sig = [o.isInstancedMesh ? 'inst' : 'mesh', o.instanceColor ? 'icolor' : '', o.geometry?.attributes.color ? `vc${o.geometry.attributes.color.itemSize}` : '', o.geometry?.morphAttributes?.position ? 'morph' : '', o.isPoints ? 'pts' : ''].join('|');
      if (!byMat.has(m)) byMat.set(m, { type: m.type, name: m.name, sigs: new Map() });
      const e = byMat.get(m);
      e.sigs.set(sig, (e.sigs.get(sig) ?? []).concat(o.name || o.parent?.name || o.type));
    });
  });
  const conflicts = [...byMat.values()].filter((e) => e.sigs.size > 1).map((e) => ({ type: e.type, sigs: Object.fromEntries([...e.sigs].map(([k, v]) => [k, v.length])) }));
  // Programas trocados por quadro: conta chamadas a getProgramParameter? Usamos info.programs antes/depois
  return { materials: byMat.size, conflicts };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
