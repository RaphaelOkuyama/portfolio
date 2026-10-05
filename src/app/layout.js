import './globals.css';
import { Inter, Shippori_Mincho } from 'next/font/google';
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
// Sem preload: a mincho vem fatiada em ~110 arquivos por unicode-range e o preload puxava
// ~55 deles (3 MB) antes do JS. Sem ele o navegador baixa só as fatias dos caracteres em uso
const display = Shippori_Mincho({
  subsets: ['latin'], weight: ['600', '800'], display: 'swap', variable: '--font-display', preload: false,
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