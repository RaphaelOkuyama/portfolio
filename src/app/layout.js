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
import InkTransition from '../components/InkTransition';
import Senbazuru from '../components/Senbazuru';
import { SettingsProvider } from '../context/SettingsContext';
import { THEME_BOOT_SCRIPT } from '../lib/themeBoot';
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from 'sonner';

// Texto em Inter; títulos em Shippori Mincho (serifa japonesa, só o subset latino)
const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });
const display = Shippori_Mincho({ subsets: ['latin'], weight: ['600', '800'], display: 'swap', variable: '--font-display' });

const SITE_URL = 'https://portfolio-raphael-okuyama.vercel.app';
const DESCRIPTION =
  'Raphael Nobuyuki Haga Okuyama (奥山) — Desenvolvedor Full-Stack (React, Next.js, NestJS, TypeScript). Um portfólio imersivo pelas quatro estações da montanha.';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Raphael Okuyama — Desenvolvedor Full-Stack', template: '%s · Raphael Okuyama' },
  description: DESCRIPTION,
  authors: [{ name: 'Raphael Nobuyuki Haga Okuyama' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'Raphael Okuyama — Desenvolvedor Full-Stack',
    description: DESCRIPTION,
    siteName: 'Raphael Okuyama',
    locale: 'pt_BR',
    images: [{ url: '/profile.jpg', width: 1200, height: 1200, alt: 'Raphael Okuyama' }],
  },
  twitter: { card: 'summary_large_image', title: 'Raphael Okuyama — Desenvolvedor Full-Stack', description: DESCRIPTION },
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
      </head>
      <body>
        <SettingsProvider>
          <JourneySync />
          <SmoothScroll />
          <SceneCanvas />
          <EnsoLoader />
          <InkTransition />
          <Senbazuru />
          <InkCursor />
          <Navbar />
          
          <SocialSidebar />
          
          <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
            {children}
            <Analytics />
          </main>

          <Toaster position="bottom-right" richColors />
          
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}