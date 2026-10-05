// Estatísticas do renderer (programas de shader, draw calls, triângulos) em pontos da jornada
import { chromium } from '@playwright/test';

const mobile = process.argv.includes('--mobile');
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3100/?perf');
await page.waitForFunction(() => window.__r3f, null, { timeout: 30000 });
await page.waitForTimeout(3000);
for (const f of [0, 0.25, 0.5, 0.75, 1]) {
  await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f);
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const { gl, scene } = window.__r3f;
    let meshes = 0, visible = 0, instanced = 0;
    scene.traverse((o) => { if (o.isMesh || o.isPoints || o.isLine) { meshes += 1; if (o.visible) visible += 1; if (o.isInstancedMesh) instanced += o.count; } });
    return { programs: gl.info.programs.length, calls: gl.info.render.calls, tris: gl.info.render.triangles, points: gl.info.render.points, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, meshes, visible, instances: instanced, px: `${gl.domElement.width}x${gl.domElement.height}` };
  });
  console.log(f, JSON.stringify(info));
}
await browser.close();
