// Erros que não vêm do nosso código: script do Vercel Analytics fora da Vercel
const DEFAULT_IGNORE = [/_vercel\/insights/, /Vercel Web Analytics/];

export function collectConsoleErrors(page, { ignore = [] } = {}) {
  const errors = [];
  const patterns = [...DEFAULT_IGNORE, ...ignore];
  const keep = (text) => !patterns.some((p) => p.test(text));
  page.on('console', (msg) => {
    // Erros de recurso ("Failed to load resource") só trazem a URL em location()
    const text = `${msg.text()} ${msg.location()?.url ?? ''}`;
    if (msg.type() === 'error' && keep(text)) errors.push(text);
  });
  page.on('pageerror', (err) => {
    if (keep(err.message)) errors.push(err.message);
  });
  return errors;
}
