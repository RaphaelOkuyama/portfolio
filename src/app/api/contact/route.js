import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  validateContact, isBot, buildMail, normalizeAppPassword, createRateLimiter,
} from '../../../lib/contactMail';

const allow = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

const MESSAGES = {
  missing: 'Campos obrigatórios ausentes.',
  email: 'E-mail inválido.',
  too_long: 'Mensagem longa demais.',
};

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: normalizeAppPassword(process.env.EMAIL_PASS) },
      // Sem resposta do Gmail em 15s, falha em vez de deixar o visitante esperando
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  // Robô preencheu o campo isca: finge sucesso e não envia nada
  if (isBot(body)) return NextResponse.json({ message: 'E-mail enviado com sucesso!' }, { status: 200 });

  const result = validateContact(body);
  if (!result.ok) return NextResponse.json({ message: MESSAGES[result.error], code: result.error }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!allow(ip)) {
    return NextResponse.json({ message: 'Muitas mensagens em pouco tempo.', code: 'rate' }, { status: 429 });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Contato: EMAIL_USER/EMAIL_PASS não configurados');
    return NextResponse.json({ message: 'Envio indisponível.', code: 'config' }, { status: 503 });
  }

  try {
    await getTransporter().sendMail(buildMail(result.data, process.env.EMAIL_USER));
    return NextResponse.json({ message: 'E-mail enviado com sucesso!' }, { status: 200 });
  } catch (error) {
    // EAUTH = senha de app inválida/revogada: problema de configuração, não do visitante
    console.error('Contato: falha no envio', error.code, error.responseCode);
    const config = error.code === 'EAUTH';
    return NextResponse.json(
      { message: 'Erro ao enviar e-mail.', code: config ? 'config' : 'send' },
      { status: config ? 503 : 502 },
    );
  }
}
