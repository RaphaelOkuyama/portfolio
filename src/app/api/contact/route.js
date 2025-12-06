import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    // Configuração do Gmail (ou outro provedor)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Seu email (configurar no .env)
        pass: process.env.EMAIL_PASS, // Sua senha de aplicativo (configurar no .env)
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER, // O email chega para você mesmo
      subject: `Novo contato do Portfólio: ${name}`,
      text: `Nome: ${name}\nEmail: ${email}\nMensagem: ${message}`,
      html: `
        <h3>Novo Contato do Site</h3>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'E-mail enviado com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json({ message: 'Erro ao enviar e-mail.' }, { status: 500 });
  }
}