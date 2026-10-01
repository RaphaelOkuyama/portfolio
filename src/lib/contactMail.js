// Validação e montagem do e-mail de contato, sem dependência do Next nem do nodemailer (testável)

export const LIMITS = { name: 100, email: 254, message: 5000 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Uma linha só (nome e e-mail vão para cabeçalhos: quebra de linha permitiria header injection)
function oneLine(value) {
  return String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim();
}

// Mensagem mantém as quebras de linha (normalizadas) e perde só caracteres de controle
function multiLine(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Retorna { ok, data } ou { ok: false, error } com o código do erro para a resposta
export function validateContact(body) {
  const name = oneLine(body?.name);
  const email = oneLine(body?.email);
  const message = multiLine(body?.message);

  if (!name || !email || !message) return { ok: false, error: 'missing' };
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) return { ok: false, error: 'email' };
  if (name.length > LIMITS.name || message.length > LIMITS.message) return { ok: false, error: 'too_long' };
  return { ok: true, data: { name, email, message } };
}

// Campo isca escondido: gente não preenche, robô sim
export function isBot(body) {
  return Boolean(oneLine(body?.company));
}

// Senha de app do Gmail vem em blocos ("abcd efgh ijkl mnop"): o SMTP quer sem espaços
export function normalizeAppPassword(pass) {
  return String(pass ?? '').replace(/\s+/g, '');
}

export function buildMail({ name, email, message }, inbox) {
  const html = escapeHtml(message).replace(/\n/g, '<br>');
  return {
    // Sempre do próprio endereço (evita spoofing); quem escreveu vai no replyTo
    from: { name: 'Portfólio — Contato', address: inbox },
    replyTo: { name, address: email },
    to: inbox,
    subject: `Novo contato do portfólio: ${name}`,
    text: `Nome: ${name}\nE-mail: ${email}\n\n${message}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;background:#fbf8f1;color:#1f1d1a;border-radius:8px">
        <p style="margin:0 0 4px;color:#c23b30;letter-spacing:.15em;font-size:12px">縁 · NOVO CONTATO</p>
        <h2 style="margin:0 0 16px">${escapeHtml(name)}</h2>
        <p style="margin:0 0 20px"><a href="mailto:${escapeHtml(email)}" style="color:#c23b30">${escapeHtml(email)}</a></p>
        <div style="padding:16px;background:#fff;border-left:3px solid #c23b30;line-height:1.6">${html}</div>
      </div>`,
  };
}

// Limite simples por IP (por instância do servidor): n envios por janela
export function createRateLimiter({ max = 5, windowMs = 10 * 60 * 1000 } = {}) {
  const hits = new Map();
  return (key, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
