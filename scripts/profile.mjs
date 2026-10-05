// Perfil de CPU dos primeiros segundos da home: tempo próprio por função e por arquivo
// (gerar o build com PERF_MAPS=1 para ver nomes reais). Uso: node scripts/profile.mjs [ms] [--mobile] [--scroll] [--tasks] [--who=função]
import { chromium } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { SourceMap } from 'node:module';

// Com o build gerado com PERF_MAPS=1, traduz a posição minificada para o arquivo-fonte e a função
const maps = new Map();
function original(url, line, column) {
  const name = url.split('/').pop();
  if (!name.endsWith('.js')) return null;
  if (!maps.has(name)) {
    // O nome do .map vem do comentário sourceMappingURL no fim do chunk (o Turbopack usa outro hash)
    const js = `.next/static/chunks/${name}`;
    const ref = existsSync(js) && readFileSync(js, 'utf8').match(/sourceMappingURL=(\S+)\s*$/)?.[1];
    const path = ref && `.next/static/chunks/${ref}`;
    maps.set(name, path && existsSync(path) ? new SourceMap(JSON.parse(readFileSync(path, 'utf8'))) : null);
  }
  const entry = maps.get(name)?.findEntry(line, column);
  if (!entry?.originalSource) return null;
  const src = entry.originalSource.replace(/^.*?(node_modules|src)[\/]/, '$1/');
  return { src, at: `${src}:${entry.originalLine + 1}`, name: entry.name };
}

const ms = Number(process.argv[2] ?? 7000);
const mobile = process.argv.includes('--mobile');
const scrolling = process.argv.includes('--scroll');
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage(mobile
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
if (scrolling) {
  // Só a rolagem: carrega, espera assentar e perfila a descida da home inteira
  await page.goto('http://localhost:3100/');
  await page.waitForTimeout(7000);
  await cdp.send('Profiler.start');
  await page.evaluate(async (ms) => {
    const H = document.documentElement.scrollHeight - innerHeight;
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      window.scrollTo(0, H * ((performance.now() - t0) / ms));
      await new Promise((r) => setTimeout(r, 16));
    }
  }, ms);
} else {
  await cdp.send('Profiler.start');
  await page.goto('http://localhost:3100/');
  await page.waitForTimeout(ms);
}
const { profile } = await cdp.send('Profiler.stop');
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const parents = new Map();
profile.nodes.forEach((n) => n.children?.forEach((c) => parents.set(c, n)));
const self = new Map();
const dt = profile.timeDeltas;
profile.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (dt[i] ?? 0)));
const fn = new Map();
const file = new Map();
for (const [id, us] of self) {
  const { callFrame: c } = byId.get(id);
  const o = original(c.url, c.lineNumber, c.columnNumber);
  const f = o ? o.src.replace(/^(node_modules\/(@[^/]+\/)?[^/]+).*/, '$1') : (c.url.split('/').pop() || '(native)');
  const key = o ? `${c.functionName || o.name || '(anon)'}  ${o.at}` : `${c.functionName || '(anon)'}  ${f}:${c.lineNumber}`;
  fn.set(key, (fn.get(key) ?? 0) + us);
  file.set(f, (file.get(f) ?? 0) + us);
}
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${(v / 1000).toFixed(0).padStart(6)} ms  ${k}`).join('\n');
// --who=nome: pilhas mais frequentes que chegam a essa função (quem chama getBoundingClientRect etc.)
const who = process.argv.find((a) => a.startsWith('--who='))?.slice(6);
if (who) {
  const stacks = new Map();
  for (const [id, us] of self) {
    let n = byId.get(id);
    if (n.callFrame.functionName !== who) continue;
    const chain = [];
    while (n && chain.length < 14) {
      const c = n.callFrame;
      const o = original(c.url, c.lineNumber, c.columnNumber);
      if (c.functionName !== '(root)') chain.push(`${c.functionName || o?.name || '(anon)'}@${o ? o.at.replace('node_modules/', '') : c.url.split('/').pop()}`);
      n = parents.get(n.id);
    }
    const key = chain.join(' < ');
    stacks.set(key, (stacks.get(key) ?? 0) + us);
  }
  console.log(top(stacks, 8));
  await browser.close();
  process.exit(0);
}

// Por tarefa longa: funções com mais tempo dentro de cada janela (> 50ms de JS contínuo)
if (process.argv.includes('--tasks')) {
  let t = profile.startTime;
  const timeline = profile.samples.map((id, i) => { t += dt[i] ?? 0; return [t, id, dt[i] ?? 0]; });
  const windows = [];
  let cur = null;
  for (const [ts, id, d] of timeline) {
    const { callFrame: c } = byId.get(id);
    const busy = c.functionName !== '(idle)';
    if (busy) {
      if (!cur || ts - cur.end > 3000) { cur = { start: ts, end: ts, items: new Map() }; windows.push(cur); }
      cur.end = ts;
      const o = original(c.url, c.lineNumber, c.columnNumber);
      // Sobe a pilha até um frame do projeto (src/) para saber quem disparou
      let n = byId.get(id); let owner = null;
      const parent = (x) => parents.get(x.id);
      for (let k = 0; k < 40 && n && !owner; k += 1) {
        const oo = original(n.callFrame.url, n.callFrame.lineNumber, n.callFrame.columnNumber);
        if (oo?.src.startsWith('src/')) owner = `${n.callFrame.functionName || oo.name || '(anon)'} ${oo.at}`;
        n = parent(n);
      }
      const key = owner ?? (o ? o.src.replace(/^(node_modules\/(@[^/]+\/)?[^/]+).*/, '$1') : c.functionName);
      cur.items.set(key, (cur.items.get(key) ?? 0) + d);
    }
  }
  windows.filter((w) => (w.end - w.start) > 50000).forEach((w) => {
    console.log(`
=== tarefa ${(w.start - profile.startTime) / 1000 | 0}ms (+${(w.end - w.start) / 1000 | 0}ms)`);
    console.log(top(w.items, 10));
  });
  await browser.close();
  process.exit(0);
}
console.log('--- por arquivo ---\n' + top(file, 15) + '\n--- por função ---\n' + top(fn, 40));
await browser.close();
