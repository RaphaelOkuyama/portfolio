'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSettings } from '../../context/SettingsContext';
import { ArrowRight, Folder } from 'lucide-react';

export default function Projects() {
  const { currentData } = useSettings();
  const { projectsPage, projects } = currentData;

  return (
    <div className="container" style={{ padding: '80px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        <h1 className="responsive-title">{projectsPage.title}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '50px', fontSize: '1.2rem' }}>
          {projectsPage.subtitle}
        </p>

        <div className="projects-grid">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 5, borderColor: 'var(--accent)' }}
              className="project-card" // Classe Responsiva
            >
              <div className="project-info"> {/* Classe Responsiva */}
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', padding: '15px', 
                  borderRadius: '12px', color: 'var(--accent)',
                  flexShrink: 0
                }}>
                  <Folder size={32} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                    {project.title}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>
                    {project.shortDesc}
                  </p>
                  
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {project.stack.slice(0, 3).map((tech, i) => (
                      <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link href={`/projects/${project.slug}`} style={{ textDecoration: 'none', width: 'fit-content' }}>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'var(--accent)', color: '#fff' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: '0.3s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {projectsPage.btnDetails} <ArrowRight size={18} />
                </motion.button>
              </Link>

            </motion.div>
          ))}
        </div>

      </motion.div>
    </div>
  );
}