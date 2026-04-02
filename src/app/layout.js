import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SocialSidebar from '../components/SocialSidebar';
import CustomCursor from '../components/CustomCursor';
import BackgroundParticles from '../components/BackgroundParticles';
import { SettingsProvider } from '../context/SettingsContext';
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: 'Raphael Okuyama | Portfolio',
  description: 'Desenvolvedor Full-Stack',
};

// ADICIONADO: viewport separado do metadata (padrão Next.js 14+)
// viewport-fit=cover é ESSENCIAL para env(safe-area-inset-*) funcionar no iPhone
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // <-- permite que o conteúdo vá atrás das barras do iPhone
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
          
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}