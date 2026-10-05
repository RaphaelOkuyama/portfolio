// Medição de performance da home (build de produção em localhost:3100): carregamento com CPU 4x
// mais lenta e rede 4G, e quadros durante a rolagem. Uso: npm run perf / npm run perf:mobile
import { chromium } from '@playwright/test';

const url = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3100/';
const mobile = process.argv.includes('--mobile');
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext(mobile
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
// Celular intermediário: CPU 4x mais lenta e rede 4G
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
await page.addInitScript(() => {
  window.__lt = [];
  window.__lcp = 0;
  // Momento em que o ensō libera a página (a classe is-loading sai do <html>)
  new MutationObserver(() => {
    if (!window.__loaderDone && document.documentElement.classList.contains('lenis') && !document.documentElement.classList.contains('is-loading')) window.__loaderDone = performance.now();
  }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'] });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((l) => { const e = l.getEntries(); window.__lcp = e[e.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls = (window.__cls ?? 0) + e.value; })).observe({ type: 'layout-shift', buffered: true });
});
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(6000);
const load = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const res = performance.getEntriesByType('resource');
  const kb = (f) => Math.round(res.filter(f).reduce((a, r) => a + (r.transferSize || 0), 0) / 1024);
  const tbt = window.__lt.filter(([s]) => s < 10000).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
  const gl = document.createElement('canvas').getContext('webgl2');
  const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
  return {
    fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0),
    lcp: Math.round(window.__lcp),
    marks: Object.fromEntries(performance.getEntriesByType('mark').filter((m) => m.name.startsWith('scene')).map((m) => [m.name, Math.round(m.startTime)])),
    threeChunk: (() => { const r = performance.getEntriesByType('resource').filter((x) => x.name.endsWith('.js')).sort((a, b) => b.transferSize - a.transferSize)[0]; return r && `${Math.round(r.startTime)}→${Math.round(r.responseEnd)} (${Math.round(r.transferSize / 1024)}KB)`; })(),
    hydrated: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),
    loaderDone: Math.round(window.__loaderDone ?? -1), load: Math.round(nav.loadEventEnd), tbt, cls: +(window.__cls ?? 0).toFixed(3),
    jsKB: kb((r) => r.name.endsWith('.js')), cssKB: kb((r) => r.name.includes('.css')), fontKB: kb((r) => /woff/.test(r.name)),
    imgKB: kb((r) => r.initiatorType === 'img' || /\.(png|jpe?g|webp|avif)/.test(r.name)), totalKB: kb(() => true), requests: res.length,
    longtasks: window.__lt.map(([s, d]) => `${s}+${d}`).join(' '), gpu: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a',
  };
});
// Rolagem contínua da home inteira em 10s, medindo o intervalo entre quadros
await cdp.send('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
const scroll = await page.evaluate(async () => {
  const frames = [];
  let last = performance.now();
  let run = true;
  const loop = (t) => { frames.push(t - last); last = t; if (run) requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  const before = window.__lt.length;
  const H = document.documentElement.scrollHeight - innerHeight;
  const t0 = performance.now();
  while (performance.now() - t0 < 10000) {
    window.scrollTo(0, H * ((performance.now() - t0) / 10000));
    await new Promise((r) => setTimeout(r, 16));
  }
  run = false;
  frames.shift();
  frames.sort((a, b) => a - b);
  const p = (q) => +frames[Math.min(frames.length - 1, Math.floor(frames.length * q))].toFixed(1);
  const c = document.querySelector('canvas');
  return { fps: Math.round(frames.length / 10), p50: p(0.5), p95: p(0.95), p99: p(0.99), jank: frames.filter((f) => f > 34).length, longtasks: window.__lt.length - before, canvas: c ? `${c.width}x${c.height}` : 'none' };
});
console.log(JSON.stringify({ mode: mobile ? 'mobile' : 'desktop', ...load, scroll }, null, 1));
await browser.close();
