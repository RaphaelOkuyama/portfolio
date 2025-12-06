import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SocialSidebar from '../components/SocialSidebar';
import CustomCursor from '../components/CustomCursor';
import BackgroundParticles from '../components/BackgroundParticles'; // <--- IMPORTAR
import { SettingsProvider } from '../context/SettingsContext';

export const metadata = {
  title: 'Raphael Okuyama | Portfolio',
  description: 'Desenvolvedor Full-Stack',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <SettingsProvider>
          <CustomCursor />
          
          {/* AQUI: Substituímos o bg-grid pelo BackgroundParticles */}
          <BackgroundParticles />
          
          <Navbar />
          <SocialSidebar />
          
          <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
            {children}
          </main>
          
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}