// Trace da timeline durante a rolagem: tempo por tipo de evento na thread principal
// (estilo, layout, pintura, GPU, scripts). Uso: node scripts/trace.mjs [--mobile]
import { chromium } from '@playwright/test';

const mobile = process.argv.includes('--mobile');
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage(mobile
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await page.goto('http://localhost:3100/');
await page.waitForTimeout(7000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const events = [];
cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value));
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking', transferMode: 'ReportEvents' });
await page.evaluate(async () => {
  const H = document.documentElement.scrollHeight - innerHeight;
  const t0 = performance.now();
  while (performance.now() - t0 < 8000) {
    window.scrollTo(0, H * ((performance.now() - t0) / 8000));
    await new Promise((r) => setTimeout(r, 16));
  }
});
await cdp.send('Tracing.end');
await done;
// Thread principal do renderer: a que tem mais eventos "RunTask" com Layout/UpdateLayoutTree
const main = events.find((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain');
const tid = main?.tid;
const by = new Map();
const count = new Map();
for (const e of events) {
  if (e.tid !== tid || e.ph !== 'X' || !e.dur) continue;
  by.set(e.name, (by.get(e.name) ?? 0) + e.dur);
  count.set(e.name, (count.get(e.name) ?? 0) + 1);
}
const top = [...by].sort((a, b) => b[1] - a[1]).slice(0, 22);
top.forEach(([k, v]) => console.log(`${(v / 1000).toFixed(0).padStart(7)} ms  ${String(count.get(k)).padStart(5)}x  ${k}`));
// Pintura: quais camadas/elementos
const paints = events.filter((e) => e.tid === tid && e.name === 'Paint' && e.args?.data);
const byNode = new Map();
paints.forEach((e) => { const k = e.args.data.nodeName ?? e.args.data.layerId; byNode.set(k, (byNode.get(k) ?? 0) + (e.dur ?? 0)); });
console.log('--- Paint por nó ---');
[...byNode].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => console.log(`${(v / 1000).toFixed(0).padStart(7)} ms  ${k}`));
// Quem invalida: nós que pedem repintura / recálculo de estilo, e por quê
for (const kind of ['PaintInvalidationTracking', 'StyleRecalcInvalidationTracking', 'StyleInvalidatorInvalidationTracking', 'LayoutInvalidationTracking']) {
  const m = new Map();
  events.filter((e) => e.name === kind && e.args?.data).forEach((e) => {
    const d = e.args.data;
    const k = `${d.nodeName ?? '?'} | ${d.reason ?? d.invalidatedSelectorId ?? d.changedClass ?? d.changedAttribute ?? d.changedPseudo ?? ''}`.slice(0, 140);
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  console.log(`--- ${kind} ---`);
  [...m].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`${String(v).padStart(6)}x  ${k}`));
}
await browser.close();
