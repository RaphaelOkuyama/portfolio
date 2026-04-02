import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SocialSidebar from '../components/SocialSidebar';
import CustomCursor from '../components/CustomCursor';
import BackgroundParticles from '../components/BackgroundParticles';
import { SettingsProvider } from '../context/SettingsContext';
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
    <html lang="pt-BR">
      <body>
        <SettingsProvider>
          <CustomCursor />
          
          <BackgroundParticles />
          
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