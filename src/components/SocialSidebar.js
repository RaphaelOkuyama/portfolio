'use client';
import { useRef } from 'react';
import { Github, Linkedin, Mail } from 'lucide-react';
import { useEdgePiece } from '../lib/edgeGuard';

// "Email" (sem hífen), como antes: "E-mail" é o rótulo do campo do formulário de contato, e os dois
// teriam o mesmo nome para leitores de tela
const LINKS = [
  { label: 'GitHub', href: 'https://github.com/RaphaelOkuyama', Icon: Github },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/raphael-okuyama/', Icon: Linkedin },
  { label: 'Email', href: 'mailto:raphaelokuyama123@gmail.com', Icon: Mail },
];

// Atalhos sociais fixos no canto (só no desktop). O conteúdo deixa a borda livre para eles
// (--edge-clear) e, sobre o rolo do emakimono e o rodapé (que já tem os mesmos links), eles somem
export default function SocialSidebar() {
  const ref = useRef(null);
  useEdgePiece(ref);
  return (
    <div ref={ref} className="social-sidebar">
      {LINKS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          className="social-sidebar-link icon-pop"
          title={label}
          aria-label={label}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <Icon size={18} aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
