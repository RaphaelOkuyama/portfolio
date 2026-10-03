// 縦書き (tategaki): o nome da seção em japonês, escrito na vertical ao lado do título, como uma
// inscrição. Decorativo: o título em português já diz tudo para leitores de tela
export default function Tate({ children }) {
  return <span className="section-tate font-jp" lang="ja" aria-hidden="true">{children}</span>;
}
