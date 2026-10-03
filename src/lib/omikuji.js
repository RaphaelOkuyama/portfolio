import { kanjiNumeral } from './kanji';

// おみくじ: o papel da sorte dos templos, com sortes de dev.
// Como no templo, a sorte vem em graus (大吉 a 凶) e em categorias: 仕事 trabalho, 学問 estudo,
// 待人 a pessoa esperada e 失物 o objeto perdido.

export const RANKS = [
  { kanji: '大吉', reading: 'daikichi', pt: 'Grande sorte', en: 'Great blessing', weight: 16 },
  { kanji: '中吉', reading: 'chūkichi', pt: 'Sorte média', en: 'Middle blessing', weight: 22 },
  { kanji: '小吉', reading: 'shōkichi', pt: 'Pequena sorte', en: 'Small blessing', weight: 22 },
  { kanji: '吉', reading: 'kichi', pt: 'Sorte', en: 'Blessing', weight: 18 },
  { kanji: '末吉', reading: 'suekichi', pt: 'Sorte futura', en: 'Future blessing', weight: 14 },
  { kanji: '凶', reading: 'kyō', pt: 'Azar', en: 'Curse', weight: 8 },
];

export const CATEGORIES = [
  { key: 'work', kanji: '仕事', pt: 'Trabalho', en: 'Work' },
  { key: 'study', kanji: '学問', pt: 'Estudo', en: 'Study' },
  { key: 'awaited', kanji: '待人', pt: 'Quem você espera', en: 'Awaited person' },
  { key: 'lost', kanji: '失物', pt: 'Objeto perdido', en: 'Lost item' },
];

// Uma frase por categoria e grau (mesma ordem de RANKS)
const LINES = {
  work: [
    ['Deploy na sexta e nada quebrou.', 'Friday deploy and nothing broke.'],
    ['O PR passa no primeiro review.', 'Your PR passes on the first review.'],
    ['O build fica verde depois do segundo café.', 'The build turns green after the second coffee.'],
    ['A reunião podia ter sido um e-mail, mas foi rápida.', 'The meeting could have been an email, but it was short.'],
    ['O bug de hoje vira a lição de amanhã.', "Today's bug becomes tomorrow's lesson."],
    ['O bug só acontece em produção.', 'The bug only happens in production.'],
  ],
  study: [
    ['A documentação responde exatamente à sua dúvida.', 'The docs answer exactly your question.'],
    ['Um tutorial curto vale por um curso inteiro.', 'A short tutorial is worth a whole course.'],
    ['Você entende recursão. De novo.', 'You understand recursion. Again.'],
    ['Leia o erro até o fim antes de pesquisar.', 'Read the whole error before searching it.'],
    ['A resposta está na terceira página de resultados.', 'The answer is on the third page of results.'],
    ['A única resposta no fórum é "resolvi, obrigado".', 'The only forum answer is "fixed it, thanks".'],
  ],
  awaited: [
    ['O recrutador responde hoje.', 'The recruiter replies today.'],
    ['Chega uma mensagem que vale a semana.', 'A message arrives that makes your week.'],
    ['Quem você espera está lendo seu README.', 'The one you await is reading your README.'],
    ['Vem, mas depois do almoço.', 'They come, but after lunch.'],
    ['Vem na próxima sprint.', 'They come next sprint.'],
    ['Foi ver o portfólio de outra pessoa.', "They went to look at someone else's portfolio."],
  ],
  lost: [
    ['O ponto e vírgula estava na linha 42.', 'The semicolon was on line 42.'],
    ['Estava no git stash o tempo todo.', 'It was in git stash all along.'],
    ['Está na aba que você ainda não fechou.', "It's in the tab you haven't closed yet."],
    ['Procure no histórico do terminal.', 'Look in your terminal history.'],
    ['Aparece quando você parar de procurar.', 'It shows up once you stop looking.'],
    ['Foi junto com o node_modules.', 'It left along with node_modules.'],
  ],
};

// Sorteio ponderado; `random` é injetável para o teste ser determinístico
export function drawOmikuji(random = Math.random) {
  const total = RANKS.reduce((sum, r) => sum + r.weight, 0);
  let roll = random() * total;
  let rankIndex = RANKS.length - 1;
  for (let i = 0; i < RANKS.length; i += 1) {
    roll -= RANKS[i].weight;
    if (roll < 0) {
      rankIndex = i;
      break;
    }
  }
  const number = 1 + Math.floor(random() * 100);
  return {
    number,
    // 第七番: o número da vareta em kanji
    numberKanji: kanjiNumeral(number),
    rank: RANKS[rankIndex],
    // No templo, quem tira 凶 amarra o papel no galho para deixar o azar para trás
    unlucky: RANKS[rankIndex].kanji === '凶',
    lines: CATEGORIES.map((c) => {
      const [pt, en] = LINES[c.key][rankIndex];
      return { ...c, text: { pt, en } };
    }),
  };
}
