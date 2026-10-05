import QRCode from 'qrcode';
import { resumeData } from '../../../data/resume';
import { buildVCard } from '../../../lib/meishi';

// QR do vCard do meishi, gerado no build (um SVG por idioma, servido como arquivo estático).
// O navegador só pede a imagem quando o cartão abre, e a biblioteca do QR nem chega ao cliente
export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ lang: 'pt' }, { lang: 'en' }];
}

export async function GET(_request, { params }) {
  const { lang } = await params;
  const data = resumeData[lang] ?? resumeData.pt;
  const svg = await QRCode.toString(buildVCard({ title: data.hero.roles[0] }), {
    type: 'svg', margin: 0, errorCorrectionLevel: 'L', color: { dark: '#1b1a17', light: '#0000' },
  });
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
