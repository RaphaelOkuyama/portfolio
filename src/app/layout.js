import './globals.css';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SocialSidebar from '../components/SocialSidebar';
import InkCursor from '../components/InkCursor';
import JourneySync from '../components/journey/JourneySync';
import SmoothScroll from '../components/journey/SmoothScroll';
import SceneCanvas from '../components/scene/SceneCanvas';
import EnsoLoader from '../components/EnsoLoader';
import NorenTransition from '../components/NorenTransition';
import Suminagashi from '../components/Suminagashi';
import Senbazuru from '../components/Senbazuru';
import { SettingsProvider } from '../context/SettingsContext';
import { THEME_BOOT_SCRIPT } from '../lib/themeBoot';
import { SITE_URL, personJsonLd, jsonLdScript } from '../lib/site';
import { Analytics } from "@vercel/analytics/react";
import { LazyToaster } from '../lib/toast';

// Texto em Inter; títulos em Shippori Mincho (serifa japonesa)
const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
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
    <html lang="pt-BR" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* Dados estruturados de Pessoa para o Google */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd()) }} />
      </head>
      <body>
        <SettingsProvider>
          <JourneySync />
          <SmoothScroll />
          <SceneCanvas />
          <EnsoLoader />
          <NorenTransition />
          <Suminagashi />
          <Senbazuru />
          <InkCursor />
          <Navbar />
          
          <SocialSidebar />
          
          <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
            {children}
            <Analytics />
          </main>

          <LazyToaster position="bottom-right" richColors />
          
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}