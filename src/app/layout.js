import './globals.css';
import { Suspense } from 'react';
import localFont from 'next/font/local';
import Navbar from '../components/Navbar';
import InkCursor from '../components/InkCursor';
import EasterEggs from '../components/EasterEggs';
import JourneySync from '../components/journey/JourneySync';
import SceneCanvas from '../components/scene/SceneCanvas';
import EnsoLoader from '../components/EnsoLoader';
import NorenTransition from '../components/NorenTransition';
import { SettingsProvider } from '../context/SettingsContext';
import { THEME_BOOT_SCRIPT } from '../lib/themeBoot';
import { SITE_URL, personJsonLd, jsonLdScript } from '../lib/site';
import { Analytics } from "@vercel/analytics/react";
import { LazyToaster } from '../lib/toast';
import Footer from '../components/Footer';
import SocialSidebar from '../components/SocialSidebar';
import SmoothScroll from '../components/journey/SmoothScroll';
import Suminagashi from '../components/Suminagashi';
import Senbazuru from '../components/Senbazuru';

// Texto em Zen Kaku Gothic New (desenho japonês que conversa com o mincho dos títulos); títulos em
// Shippori Mincho. Todas em subconjunto, geradas por scripts/subset-font.mjs (npm run font)
const sans = localFont({
  src: [
    { path: '../fonts/zen-kaku-gothic-new-400.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/zen-kaku-gothic-new-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/zen-kaku-gothic-new-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
  // Mesmas métricas verticais da Inter (a fonte anterior): a altura de linha "normal" não muda e
  // nenhum layout medido (rodapé com a altura exata da tela, rolo, cartões) cresce
  declarations: [
    { prop: 'ascent-override', value: '96.9%' },
    { prop: 'descent-override', value: '24.2%' },
    { prop: 'line-gap-override', value: '0%' },
  ],
});
// Shippori Mincho só com o latim (scripts/subset-font.mjs): os títulos usam ela para as letras e
// as fontes japonesas do sistema para kana/kanji. Pelo next/font/google vinham 244 fatias
// japonesas e 64KB de @font-face no CSS que bloqueia a primeira pintura
const display = localFont({
  src: [
    { path: '../fonts/shippori-mincho-600.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/shippori-mincho-800.woff2', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-display',
  fallback: ['Hiragino Mincho ProN', 'Yu Mincho', 'serif'],
});
// Kana e kanji (.font-jp e o japonês dos títulos): a mesma Shippori Mincho, só com os caracteres do
// site (~66 KB por peso). Sem pré-carregar: é enfeite, troca quando chega (o LCP é o nome latino)
const jp = localFont({
  src: [
    { path: '../fonts/shippori-mincho-jp-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/shippori-mincho-jp-800.woff2', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  variable: '--font-jp',
  fallback: ['Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', 'Noto Serif JP', 'serif'],
});

const DESCRIPTION =
  'Raphael Okuyama, desenvolvedor full-stack (Next.js, NestJS, TypeScript). Software em produção para 42+ clínicas. Disponível para CLT, PJ e freelance.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Raphael Okuyama | Desenvolvedor Full-Stack', template: '%s · Raphael Okuyama' },
  description: DESCRIPTION,
  authors: [{ name: 'Raphael Nobuyuki Haga Okuyama' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'Raphael Okuyama | Desenvolvedor Full-Stack',
    description: DESCRIPTION,
    siteName: 'Raphael Okuyama',
    locale: 'pt_BR',
    // A imagem vem de app/opengraph-image.js (cartão 1200x630 com 奥山 e as montanhas)
  },
  twitter: { card: 'summary_large_image', title: 'Raphael Okuyama | Desenvolvedor Full-Stack', description: DESCRIPTION },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f1626' },
    { media: '(prefers-color-scheme: light)', color: '#f3eee3' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable} ${jp.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* Dados estruturados de Pessoa para o Google */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd()) }} />
      </head>
      <body>
        <SettingsProvider>
          <JourneySync />
          <SmoothScroll />
          {/* Cada <Suspense> é hidratado à parte (hidratação seletiva do React): o essencial (barra,
              conteúdo) primeiro e os enfeites depois, em tarefas curtas. Num commit só, o layout
              inteiro com os efeitos de animação travava a thread por centenas de ms no celular */}
          <Suspense fallback={null}><SceneCanvas /></Suspense>
          <Suspense fallback={null}><EnsoLoader /></Suspense>
          <Suspense fallback={null}><NorenTransition /></Suspense>
          <Suspense fallback={null}><Suminagashi /></Suspense>
          <Suspense fallback={null}><Senbazuru /></Suspense>
          <Suspense fallback={null}><InkCursor /></Suspense>
          <Suspense fallback={null}><EasterEggs /></Suspense>
          <Navbar />

          <Suspense fallback={null}><SocialSidebar /></Suspense>

          <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
            {children}
            <Analytics />
          </main>

          <Suspense fallback={null}><LazyToaster position="bottom-right" richColors /></Suspense>

          <Suspense fallback={null}><Footer /></Suspense>
        </SettingsProvider>
      </body>
    </html>
  );
}