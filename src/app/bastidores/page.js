import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Lang from '../../components/Lang';

export const metadata = {
  title: 'Bastidores',
  description: 'Como a montanha deste portfólio foi feita: a cena em Three.js, a luz, a performance e os testes.',
};

// 裏 (ura, o avesso): o making-of do site, nos dois idiomas. Só fatos do próprio código
const SECTIONS = [
  {
    kanji: '山',
    title: { pt: 'O conceito', en: 'The concept' },
    body: {
      pt: [
        '奥山 (Okuyama), o sobrenome do meu pai, quer dizer "montanha profunda". Rolar a página é caminhar montanha adentro: cada seção é um marco de pedra (丁石) contando quantos chō faltam até o 奥の院, o santuário no fim do caminho, que aqui é o contato.',
        'As quatro estações passam com a rolagem, do sakura do início à neve do fim, e cada uma tinge a cena, o texto e o som.',
      ],
      en: [
        '奥山 (Okuyama), my father’s family name, means "deep mountain". Scrolling is walking into the mountain: each section is a stone marker (丁石) counting the chō left to the 奥の院, the sanctuary at the end of the path, which here is the contact form.',
        'The four seasons go by as you scroll, from the cherry blossoms at the start to the snow at the end, and each one tints the scene, the text and the sound.',
      ],
    },
  },
  {
    kanji: '景',
    title: { pt: 'A cena', en: 'The scene' },
    body: {
      pt: [
        'Three.js com React Three Fiber. Céu, montanhas, chão, rio, névoa e pétalas são shaders escritos para o site; o torii, as lanternas, o iwakura e o pagode são geometria montada em código, sem modelos baixados (os komainu, o corvo e o dragão são modelos escaneados com crédito no rodapé).',
        'As peças não usam as luzes do three: o sombreado é pintado em cada face, e um shader próprio soma o contraluz da lua e as poças de luz das lanternas. Por cima, um passe de gradação de cor (luzes altas que arredondam, vinheta e grão de filme); no nível alto, o brilho das lanternas e os raios do luar.',
        'Texturas do Poly Haven (CC0) entram só como tom, em cinza, sobre a paleta: granito, musgo e o chão de cada estação.',
      ],
      en: [
        'Three.js with React Three Fiber. Sky, mountains, ground, river, mist and petals are shaders written for the site; the torii, lanterns, iwakura and pagoda are geometry built in code, not downloaded models (the komainu, crow and dragon are scanned models credited in the footer).',
        'The pieces don’t use three’s lights: shading is painted per face, and a custom shader adds the moon’s backlight and the lanterns’ pools of light. On top, a color grading pass (soft highlight roll-off, vignette and film grain); on high quality, the lantern glow and the moonbeams.',
        'Poly Haven textures (CC0) only add tone, in grayscale, over the palette: granite, moss and each season’s ground.',
      ],
    },
  },
  {
    kanji: '速',
    title: { pt: 'Performance', en: 'Performance' },
    body: {
      pt: [
        'O primeiro quadro é uma foto da própria cena (o pôster), então o texto e a montanha aparecem antes do JavaScript da cena chegar. A cena 3D entra por cima, no mesmo enquadramento.',
        'A qualidade gráfica é escolhida pela placa de vídeo e desce um nível se o FPS cair; parada, a cena desenha a 30 quadros por segundo. As peças são montadas em etapas curtas, e as fontes vêm em subconjunto (o japonês inteiro do site em ~67 KB).',
      ],
      en: [
        'The first frame is a picture of the scene itself (the poster), so the text and the mountain show up before the scene’s JavaScript arrives. The 3D scene fades in on top, with the same framing.',
        'Graphics quality is picked from the GPU and steps down if the frame rate drops; when idle, the scene draws at 30 frames per second. Pieces are mounted in short steps, and fonts are subset (all of the site’s Japanese in ~67 KB).',
      ],
    },
  },
  {
    kanji: '守',
    title: { pt: 'Para todo mundo', en: 'For everyone' },
    body: {
      pt: [
        'Sem placa de vídeo (WebGL por software), a cena vira uma versão leve; sem WebGL, uma montanha pintada em Canvas 2D e SVG. Todo o conteúdo é HTML de verdade, e com movimento reduzido nada se mexe sozinho.',
        'Vitest cobre a lógica (câmera, estações, qualidade, numerais) e Playwright percorre o site de ponta a ponta, do loader ao formulário.',
      ],
      en: [
        'Without a GPU (software WebGL) the scene switches to a light version; without WebGL, a mountain painted in Canvas 2D and SVG. All content is real HTML, and with reduced motion nothing moves on its own.',
        'Vitest covers the logic (camera, seasons, quality, numerals) and Playwright walks the site end to end, from the loader to the form.',
      ],
    },
  },
];

const CREDITS = [
  { pt: 'Texturas: Poly Haven (CC0): lichen_rock, mossy_rock, forest_floor, forest_leaves_02, snow_02.', en: 'Textures: Poly Haven (CC0): lichen_rock, mossy_rock, forest_floor, forest_leaves_02, snow_02.' },
  { pt: 'Traços do 奥山 no loader: KanjiVG (CC BY-SA 3.0).', en: 'Brush strokes of 奥山 in the loader: KanjiVG (CC BY-SA 3.0).' },
  { pt: 'Fontes: Shippori Mincho e Zen Kaku Gothic New (SIL Open Font License).', en: 'Fonts: Shippori Mincho and Zen Kaku Gothic New (SIL Open Font License).' },
];

export default function Bastidores() {
  return (
    <article className="container making">
      <Link href="/" className="making-back hover-back">
        <ArrowLeft size={18} aria-hidden="true" /> <Lang pt="Voltar à montanha" en="Back to the mountain" />
      </Link>
      <header className="making-head">
        <span className="making-kanji font-jp" lang="ja" aria-hidden="true">裏</span>
        <h1 className="making-title"><Lang pt="Bastidores" en="Behind the scenes" /></h1>
        <p className="making-lead">
          <Lang
            pt="Como esta montanha foi feita: a ideia, a cena, a luz, a performance e os testes."
            en="How this mountain was made: the idea, the scene, the light, the performance and the tests."
          />
        </p>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.kanji} className="making-section">
          <h2 className="making-section-title">
            <span className="making-section-kanji font-jp" lang="ja" aria-hidden="true">{section.kanji}</span>
            <Lang pt={section.title.pt} en={section.title.en} />
          </h2>
          <div className="making-body">
            {section.body.pt.map((text, i) => (
              <p key={text.slice(0, 24)}><Lang pt={text} en={section.body.en[i]} /></p>
            ))}
          </div>
        </section>
      ))}
      <section className="making-section">
        <h2 className="making-section-title">
          <span className="making-section-kanji font-jp" lang="ja" aria-hidden="true">謝</span>
          <Lang pt="Créditos" en="Credits" />
        </h2>
        <ul className="making-credits">
          {CREDITS.map((c) => <li key={c.pt}><Lang pt={c.pt} en={c.en} /></li>)}
        </ul>
      </section>
    </article>
  );
}
