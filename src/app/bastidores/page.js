import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import Lang from '../../components/Lang';

export const metadata = {
  title: 'Bastidores',
  description: 'Como a montanha deste portfólio foi feita: a cena em Three.js, os shaders, o domínio secreto, a performance medida e o que deu errado no caminho.',
};

// 裏 (ura, o avesso): o making-of do site, nos dois idiomas. Só fatos do próprio código
const SECTIONS = [
  {
    kanji: '山',
    id: 'conceito',
    shot: { file: 'site-1', pt: 'A hero à noite: o torii na entrada da montanha', en: 'The hero at night: the torii at the foot of the mountain' },
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
    id: 'cena',
    shot: { file: 'site-3', pt: 'Os bambus de Tanabata da seção de tecnologias', en: 'The Tanabata bamboos of the stack section' },
    title: { pt: 'A cena', en: 'The scene' },
    body: {
      pt: [
        'Three.js com React Three Fiber. Céu, montanhas, chão, rio, névoa e pétalas são shaders escritos para o site; o torii, as lanternas, o iwakura e o pagode são geometria montada em código, sem modelos baixados (os komainu, o corvo e o dragão são modelos escaneados com crédito no rodapé).',
        'As peças não usam as luzes do three: o sombreado é pintado em cada face, e um shader próprio soma o contraluz da lua e as poças de luz das lanternas. Por cima, um passe de gradação de cor (luzes altas que arredondam, vinheta e grão de filme); no nível alto, o brilho das lanternas e os raios do luar.',
        'Texturas do Poly Haven (CC0) entram só como tom, em cinza, sobre a paleta: granito, musgo e o chão de cada estação.',
        'O caminho de pedra não é uma malha à parte: um mapa com a distância até o sandō é calculado uma vez e o shader do chão desenha com ele a faixa de cascalho, a sombra do meio-fio e o musgo que cresce longe dos passos. A grama e as pedras soltas são instâncias espalhadas pelo mesmo mapa.',
      ],
      en: [
        'Three.js with React Three Fiber. Sky, mountains, ground, river, mist and petals are shaders written for the site; the torii, lanterns, iwakura and pagoda are geometry built in code, not downloaded models (the komainu, crow and dragon are scanned models credited in the footer).',
        'The pieces don’t use three’s lights: shading is painted per face, and a custom shader adds the moon’s backlight and the lanterns’ pools of light. On top, a color grading pass (soft highlight roll-off, vignette and film grain); on high quality, the lantern glow and the moonbeams.',
        'Poly Haven textures (CC0) only add tone, in grayscale, over the palette: granite, moss and each season’s ground.',
        'The stone path is not a separate mesh: a map with the distance to the sandō is computed once, and the ground shader uses it to draw the gravel band, the curb shadow and the moss that grows away from the footsteps. Grass and loose rocks are instances scattered with the same map.',
      ],
    },
  },
  {
    kanji: '影',
    id: 'shaders',
    shot: { src: '/bastidores/rio.jpg', pt: 'O rio à noite: o brilho da lua, o reflexo da ponte e as lanternas', en: 'The river at night: moon glitter, the bridge’s reflection and the lanterns' },
    title: { pt: 'Os shaders', en: 'The shaders' },
    body: {
      pt: [
        'Mais de vinte shaders em GLSL, todos escritos à mão. O rio é o mais trabalhado: reflete a ponte em arco com uma conta de espelho (sem renderizar a cena duas vezes), escurece embaixo dela e acende um rastro de brilho na direção da lua, quebrado pelas ondas.',
        'A névoa são planos em pé que somem pela altura acima do chão, e não pela borda da textura: assim nenhuma faixa corta o rio numa linha reta. As lanternas de pedra têm um halo de pontos aditivos e uma poça de luz somada no shader do chão.',
        'No vazio do domínio a luz é quebrada em faixas de tom, como fundo pintado de anime. São quatro linhas:',
      ],
      en: [
        'More than twenty GLSL shaders, all written by hand. The river got the most work: it reflects the arched bridge with a mirror equation (no second render of the scene), darkens under it and lights a glitter trail toward the moon, broken by the waves.',
        'The mist is made of upright planes that fade by height above the ground, not by the texture edge, so no band cuts the river in a straight line. The stone lanterns have a halo of additive points and a pool of light added in the ground shader.',
        'In the domain’s void the light is split into tone bands, like a painted anime background. It takes four lines:',
      ],
    },
    code: [
      'float lum = dot(col, vec3(0.299, 0.587, 0.114));',
      'float lv = lum * 7.0;',
      'float cel = (floor(lv) + smoothstep(0.38, 0.62, fract(lv))) / 7.0;',
      'col *= mix(lum, cel, 0.8) / lum;',
    ].join('\n'),
  },
  {
    kanji: '領',
    id: 'segredo',
    shot: { src: '/bastidores/dominio.jpg', pt: 'O vazio do domínio: o astro negro, o anel e as manchas de tinta', en: 'The domain’s void: the black star, the ring and the ink splats' },
    title: { pt: 'O segredo', en: 'The secret' },
    body: {
      pt: [
        'Há uma palavra que, digitada em qualquer lugar da página, abre um domínio: uma homenagem a Jujutsu Kaisen, com desenho próprio. O selo de mão em close, a esfera negra fechando na tela, um instante de branco e então o espaço, com um astro negro que joga em você os projetos, a stack e os números, até a tela não aguentar.',
        'São três camadas: um shader em WebGL2 para o vazio, um Canvas 2D para as peças de informação e uma linha do tempo em GSAP para a direção de cinema (barras, quadros de impacto em negativo, linhas de velocidade, cartelas). No pico, tudo congela em preto e branco, inclusive o cursor.',
        'Na saída, a tela racha em cacos, e cada caco é a região de um elemento real da página: os glifos voltam um a um para o lugar exato em que o navegador os desenhou. O shader é compilado enquanto a pessoa ainda digita a palavra, para a abertura não engasgar.',
      ],
      en: [
        'There is a word that, typed anywhere on the page, opens a domain: a homage to Jujutsu Kaisen, with original artwork. The hand seal in close-up, the black sphere closing on the screen, an instant of white and then space, with a black star that throws the projects, the stack and the numbers at you until the screen can’t take it.',
        'It is three layers: a WebGL2 shader for the void, a 2D canvas for the pieces of information and a GSAP timeline for the film direction (scope bars, negative impact frames, speed lines, title cards). At the peak everything freezes in black and white, the cursor included.',
        'On the way out the screen cracks into shards, and each shard is the region of a real element of the page: glyphs return one by one to the exact spot where the browser drew them. The shader is compiled while the word is still being typed, so the opening doesn’t stutter.',
      ],
    },
  },
  {
    kanji: '速',
    id: 'performance',
    shot: { file: 'site-4', pt: 'O emakimono dos projetos, que se desenrola com a rolagem', en: 'The projects emakimono, which unrolls as you scroll' },
    title: { pt: 'Performance', en: 'Performance' },
    body: {
      pt: [
        'O primeiro quadro é uma foto da própria cena (o pôster), então o texto e a montanha aparecem antes do JavaScript da cena chegar. A cena 3D entra por cima, no mesmo enquadramento.',
        'A qualidade gráfica é escolhida pela placa de vídeo e desce um nível se o FPS cair; parada, a cena desenha a 30 quadros por segundo. As peças são montadas em etapas curtas, e as fontes vêm em subconjunto: 196 KB no total, com os kanji das microestações num arquivo à parte.',
        'Tudo é medido num roteiro próprio, com rede 4G (1,6 Mbps) e processador quatro vezes mais lento: a primeira pintura sai em 1,4 s. Nesse cenário a cena 3D ainda está baixando quando a página já podia ser lida, então a abertura não espera mais por ela: passados 4,5 s sem o código da cena, a íris abre sobre o pôster e a cena entra depois. A página passou a ser liberada em 7,0 s, e não em 9,2 s.',
        'O que não funcionou: adiantar o download da cena. Medi duas vezes e o ganho foi de 0,2 s, porque o gargalo ali é a banda, não a ordem dos pedidos. Saiu do código.',
      ],
      en: [
        'The first frame is a picture of the scene itself (the poster), so the text and the mountain show up before the scene’s JavaScript arrives. The 3D scene fades in on top, with the same framing.',
        'Graphics quality is picked from the GPU and steps down if the frame rate drops; when idle, the scene draws at 30 frames per second. Pieces are mounted in short steps, and fonts are subset: 196 KB in total, with the micro-season kanji in a separate file.',
        'Everything is measured with a script of my own, on 4G (1.6 Mbps) and a processor four times slower: first paint lands at 1.4 s. In that scenario the 3D scene is still downloading when the page could already be read, so the opening no longer waits for it: after 4.5 s without the scene code, the iris opens over the poster and the scene comes in later. The page is now released at 7.0 s instead of 9.2 s.',
        'What didn’t work: starting the scene download earlier. I measured it twice and the gain was 0.2 s, because the bottleneck there is bandwidth, not request order. It left the code.',
      ],
    },
  },
  {
    kanji: '誤',
    id: 'erros',
    title: { pt: 'O que deu errado', en: 'What went wrong' },
    body: {
      pt: [
        'O rio sumiu sem nenhum erro no console. A causa: uma variável chamada half, palavra reservada em GLSL ES. O shader não compilava, o aquecimento nunca terminava e o grupo ficava escondido para sempre. Achei pintando a saída de magenta.',
        'Uma linha branca cortava o rio. Era um plano de névoa entrando no chão embaixo da água. Para descobrir qual malha desenhava aquilo, escondi os grupos por shader, um por vez, tirando um print de cada.',
        'A grama ficou branca à noite: lâminas finas com normal por face pegavam o contraluz da lua de frente. Hoje todas usam a mesma normal, viradas para a câmera.',
      ],
      en: [
        'The river vanished with no error in the console. The cause: a variable named half, a reserved word in GLSL ES. The shader didn’t compile, the warm-up never finished and the group stayed hidden forever. I found it by painting the output magenta.',
        'A white line cut across the river. It was a mist plane entering the ground under the water. To find which mesh drew it, I hid the groups by shader, one at a time, with a screenshot of each.',
        'The grass turned white at night: thin blades with per-face normals caught the moon’s backlight head-on. Now they all share one normal, facing the camera.',
      ],
    },
  },
  {
    kanji: '守',
    id: 'acesso',
    shot: { file: 'site-5', pt: 'O contato à beira do rio de lanternas', en: 'The contact section by the lantern river' },
    title: { pt: 'Para todo mundo', en: 'For everyone' },
    body: {
      pt: [
        'Sem placa de vídeo (WebGL por software), a cena vira uma versão leve; sem WebGL, uma montanha pintada em Canvas 2D e SVG. Todo o conteúdo é HTML de verdade, e com movimento reduzido nada se mexe sozinho.',
        'Vitest cobre a lógica (câmera, estações, qualidade, numerais) com 324 testes, e Playwright percorre o site de ponta a ponta, do loader ao formulário, com 242.',
      ],
      en: [
        'Without a GPU (software WebGL) the scene switches to a light version; without WebGL, a mountain painted in Canvas 2D and SVG. All content is real HTML, and with reduced motion nothing moves on its own.',
        'Vitest covers the logic (camera, seasons, quality, numerals) with 324 tests, and Playwright walks the site end to end, from the loader to the form, with 242.',
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
            pt="Como esta montanha foi feita: a ideia, a cena, os shaders, o segredo, a performance medida e o que deu errado no caminho."
            en="How this mountain was made: the idea, the scene, the shaders, the secret, the measured performance and what went wrong along the way."
          />
        </p>
        {/* 目次: as partes da página, para pular direto */}
        <nav className="making-toc" aria-label="Bastidores">
          <ol>
            {SECTIONS.map((section) => (
              <li key={section.kanji}>
                <a href={`#${section.id}`}>
                  <span className="font-jp" lang="ja" aria-hidden="true">{section.kanji}</span>
                  <Lang pt={section.title.pt} en={section.title.en} />
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      {SECTIONS.map((section) => (
        <section key={section.kanji} id={section.id} className="making-section">
          <h2 className="making-section-title">
            <span className="making-section-kanji font-jp" lang="ja" aria-hidden="true">{section.kanji}</span>
            <Lang pt={section.title.pt} en={section.title.en} />
          </h2>
          {/* Print da própria cena (os mesmos da página do projeto), com legenda nos dois idiomas */}
          {section.shot ? (
            <figure className="making-shot">
              <Image
                src={section.shot.src ?? `/projects/portfolio-okuyama/${section.shot.file}.jpg`}
                alt=""
                width={1600}
                height={800}
                sizes="(max-width: 800px) 92vw, 760px"
              />
              <figcaption><Lang pt={section.shot.pt} en={section.shot.en} /></figcaption>
            </figure>
          ) : null}
          <div className="making-body">
            {section.body.pt.map((text, i) => (
              <p key={text.slice(0, 24)}><Lang pt={text} en={section.body.en[i]} /></p>
            ))}
          </div>
          {/* Trecho real do código (GLSL é o mesmo nos dois idiomas) */}
          {section.code ? <pre className="making-code" tabIndex={0}><code>{section.code}</code></pre> : null}
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
