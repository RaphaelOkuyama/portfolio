'use client';
import dynamic from 'next/dynamic';
import { useSettings } from '../context/SettingsContext';

// Cada seção num chunk e num limite de Suspense próprios (o HTML continua vindo do servidor):
// o React hidrata e roda os efeitos (GSAP, SplitText, ScrollTrigger) de uma seção por vez, em
// tarefas curtas. Juntas, num commit só, travavam a thread ~400ms num celular
const loaders = {
  about: () => import('./about/AboutSection'),
  stack: () => import('./stack/ZenStack'),
  projects: () => import('./projects/EmakiProjects'),
  experience: () => import('./ExperienceSection'),
  contact: () => import('./contact/ContactSection'),
};
const AboutSection = dynamic(loaders.about);
const ZenStack = dynamic(loaders.stack);
const EmakiProjects = dynamic(loaders.projects);
const ExperienceSection = dynamic(loaders.experience);
const ContactSection = dynamic(loaders.contact);

// Nas outras páginas os chunks são baixados quando o navegador fica ocioso: sem isso, ir até a
// home (ou /#contato) esperava a cascata de downloads antes de trocar de tela
export function preloadHomeSections() {
  Object.values(loaders).forEach((load) => load().catch(() => {}));
}

// Seções animadas da jornada: seguem o idioma escolhido. Os ícones chegam prontos do servidor.
export default function HomeSections({ icons }) {
  const { currentData } = useSettings();
  return (
    <>
      <AboutSection about={currentData.about} />
      <ZenStack techData={currentData.techSection} icons={icons} />
      <EmakiProjects projects={currentData.projects} labels={currentData.projectsPage} />
      <ExperienceSection
        experience={currentData.experience}
        education={currentData.education}
        labels={currentData.experienceLabels}
        title={currentData.experienceTitle}
      />
      <ContactSection contact={currentData.contactPage} />
    </>
  );
}
