'use client';
import { useSettings } from '../context/SettingsContext';
import AboutSection from './about/AboutSection';
import ZenStack from './stack/ZenStack';
import EmakiProjects from './projects/EmakiProjects';
import ExperienceSection from './ExperienceSection';
import ContactSection from './contact/ContactSection';

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
