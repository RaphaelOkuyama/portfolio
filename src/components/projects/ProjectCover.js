import Image from 'next/image';
import { Lock } from 'lucide-react';
import { EcgMark } from './Ecg';

const host = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

// Barra de janela do navegador (com o endereço do site no ar, quando há um)
function BrowserBar({ address }) {
  return (
    <div className="case-cover-bar" aria-hidden="true">
      <span className="case-cover-dots"><i /><i /><i /></span>
      {address ? <span className="case-cover-address">{address}</span> : null}
    </div>
  );
}

export function hasCover(project) {
  return project.slug === 'imacardios' || project.endpoints?.length > 0 || project.images?.length > 0;
}

// Capa do estudo de caso, logo depois do topo: o produto aparece no primeiro scroll (antes a
// primeira imagem só vinha na galeria, no fim). Print de site numa janela de navegador, telas de
// celular lado a lado, o ECG da IMACARDIOS (produto privado) ou, nas APIs sem tela, as rotas
export default function ProjectCover({ project, labels }) {
  if (project.slug === 'imacardios') {
    return (
      <figure className="case-cover is-ecg">
        <div className="case-cover-paper" aria-hidden="true"><EcgMark /></div>
      </figure>
    );
  }

  if (project.endpoints?.length) {
    return (
      <figure className="case-cover is-api">
        <div className="case-cover-window">
          <BrowserBar address={labels.apiTitle} />
          <ul className="case-cover-routes">
            {project.endpoints.map(({ method, path, auth }) => (
              <li key={`${method} ${path}`}>
                <span className={`case-cover-method is-${method.toLowerCase()}`}>{method}</span>
                <code>{path}</code>
                {auth ? (
                  <span className="case-cover-auth" title={labels.apiAuth}>
                    <Lock size={13} aria-hidden="true" />
                    <span className="sr-only">{labels.apiAuth}</span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </figure>
    );
  }

  if (!project.images?.length) return null;

  if (project.imageMobile) {
    return (
      <figure className="case-cover is-phones">
        {project.images.slice(0, 3).map((img, i) => (
          <span key={img.src} className="case-cover-phone">
            <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 30vw, 260px" priority={i === 0} />
          </span>
        ))}
      </figure>
    );
  }

  const cover = project.images[0];
  return (
    <figure className="case-cover is-site">
      <div className="case-cover-window">
        <BrowserBar address={host(project.deployLink)} />
        <div className="case-cover-shot">
          {project.video ? (
            <video
              className="case-cover-video"
              src={project.video.src}
              poster={cover.src}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-label={cover.alt}
            />
          ) : (
            <Image src={cover.src} alt={cover.alt} fill sizes="(max-width: 1240px) 92vw, 1100px" priority />
          )}
        </div>
      </div>
    </figure>
  );
}
