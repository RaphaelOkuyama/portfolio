'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSettings } from '../../../context/SettingsContext';
import { ArrowLeft, Github, Globe, Layers, CheckCircle, ExternalLink, Code2 } from 'lucide-react';

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const { currentData } = useSettings();
  
  const [project, setProject] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false); // Estado para responsividade

  useEffect(() => {
    // Detectar tamanho da tela
    const checkDevice = () => setIsDesktop(window.innerWidth >= 900); // Breakpoint de 900px
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    if (currentData && currentData.projects) {
      const found = currentData.projects.find((p) => p.slug === params.slug);
      if (found) {
        setProject(found);
      }
    }
  }, [params.slug, currentData]);

  if (!project) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>{currentData.projectsPage.loadingText || "Carregando..."}</p>
    </div>
  );

  return (
    // AJUSTE: Padding menor no mobile
    <div className="container" style={{ padding: isDesktop ? '100px 24px' : '80px 20px', maxWidth: '1000px' }}>
      
      <motion.button 
        onClick={() => router.back()}
        whileHover={{ x: -5, color: 'var(--accent)' }}
        style={{ 
          background: 'none', border: 'none', color: 'var(--text-secondary)', 
          display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '40px', fontSize: '1rem', fontWeight: 'bold'
        }}
      >
        <ArrowLeft size={20} /> {currentData.projectsPage.btnBack || "Voltar"}
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        <h1 style={{ fontSize: isDesktop ? '3.5rem' : '2.5rem', marginBottom: '20px', lineHeight: 1.1 }}>
          {project.title}
        </h1>
        
        {/* STACK */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {project.stack.map((tech, i) => (
            <span key={i} style={{ 
              padding: '6px 14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent)',
              borderRadius: '20px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.85rem'
            }}>
              {tech}
            </span>
          ))}
        </div>

        {/* IMAGEM: Altura automática no mobile */}
        <div style={{ 
          width: '100%', 
          aspectRatio: '16/9', 
          background: 'var(--card-bg)', 
          borderRadius: '20px', 
          marginBottom: '50px', 
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'
        }}>
          {project.image ? (
            <img src={project.image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Code2 size={64} style={{ opacity: 0.2, marginBottom: '10px' }} />
              <p>{currentData.projectsPage.projectImage}</p>
            </div>
          )}
        </div>

        {/* LAYOUT RESPONSIVO: Grid no Desktop, Coluna no Mobile */}
        <div style={{ 
          display: isDesktop ? 'grid' : 'flex', 
          flexDirection: 'column',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: isDesktop ? '60px' : '40px' 
        }}>
          
          {/* LADO ESQUERDO */}
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--text-primary)' }}>
              {currentData.projectsPage.aboutProject}
            </h2>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '40px', whiteSpace: 'pre-line' }}>
              {project.longDesc}
            </p>

            {/* BOTÕES */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {project.repoLink && (
                <a href={project.repoLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', width: isDesktop ? 'auto' : '100%' }}>
                  <motion.button 
                    whileHover={{ scale: 1.05, borderColor: 'var(--accent)', color: 'var(--accent)' }} 
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      padding: '14px 28px', borderRadius: '50px', border: '1px solid var(--border)', background: 'var(--card-bg)', 
                      color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                      fontWeight: 'bold', fontSize: '1rem', transition: '0.3s', justifyContent: 'center', width: '100%'
                    }}
                  >
                    <Github size={20} /> {currentData.projectsPage.btnCode}
                  </motion.button>
                </a>
              )}
              
              {project.deployLink && (
                <a href={project.deployLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', width: isDesktop ? 'auto' : '100%' }}>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: 'var(--accent)', color: '#fff' }} 
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      padding: '14px 28px', borderRadius: '50px', border: '1px solid var(--accent)', background: 'transparent', 
                      color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', 
                      fontWeight: 'bold', fontSize: '1rem', transition: '0.3s', justifyContent: 'center', width: '100%'
                    }}
                  >
                    <Globe size={20} /> {currentData.projectsPage.btnDeploy} <ExternalLink size={16} />
                  </motion.button>
                </a>
              )}
            </div>
          </div>

          {/* LADO DIREITO */}
          <div style={{ height: 'fit-content' }}>
            <div style={{ 
              background: 'var(--card-bg)', padding: '30px', borderRadius: '20px', 
              border: '1px solid var(--border)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' 
            }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <Layers color="var(--accent)" size={24} /> 
                {currentData.projectsPage.features}
              </h3>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {project.features && project.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '12px', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
                    <CheckCircle size={18} color="var(--accent)" style={{ marginTop: '3px', flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}