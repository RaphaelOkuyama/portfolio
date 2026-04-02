import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Sanitiza strings para evitar header injection no email
function sanitize(str = '') {
  return String(str).replace(/[\r\n]/g, ' ').trim().slice(0, 1000);
}

export async function POST(req) {
  try {
    const body = await req.json();

    const name    = sanitize(body.name);
    const email   = sanitize(body.email);
    const message = sanitize(body.message);

    // Validação básica
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    // Validação simples de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'E-mail inválido.' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      // CORREÇÃO: 'from' deve ser sempre o seu próprio email para evitar
      // spoofing. O email do remetente vai no 'replyTo'.
      from: `"Portfolio Contato" <${process.env.EMAIL_USER}>`,
      replyTo: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `Novo contato do Portfólio: ${name}`,
      text: `Nome: ${name}\nEmail: ${email}\nMensagem: ${message}`,
      html: `
        <h3>Novo Contato do Site</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p style="white-space: pre-line;">${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'E-mail enviado com sucesso!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { message: 'Erro ao enviar e-mail.' },
      { status: 500 }
    );
  }
}