import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SocialSidebar from '../components/SocialSidebar';
import InkCursor from '../components/InkCursor';
import JourneySync from '../components/journey/JourneySync';
import SmoothScroll from '../components/journey/SmoothScroll';
import SceneCanvas from '../components/scene/SceneCanvas';
import EnsoLoader from '../components/EnsoLoader';
import { SettingsProvider } from '../context/SettingsContext';
import { THEME_BOOT_SCRIPT } from '../lib/themeBoot';
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Raphael Okuyama | Portfolio',
  description: 'Desenvolvedor Full-Stack',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', 
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <SettingsProvider>
          <JourneySync />
          <SmoothScroll />
          <SceneCanvas />
          <EnsoLoader />
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