// 七十二候 (shichijūni kō): o ano japonês em 72 microestações de uns 5 dias cada.
// Datas de início aproximadas (variam um dia de um ano para o outro), no fuso de Tóquio.
// [mês, dia, kanji, leitura, pt, en]
export const MICROSEASONS = [
  [2, 4, '東風解凍', 'harukaze kōri wo toku', 'O vento leste derrete o gelo', 'East wind melts the ice'],
  [2, 9, '黄鶯睍睆', 'uguisu naku', 'Os rouxinóis começam a cantar', 'Bush warblers start singing'],
  [2, 14, '魚上氷', 'uo kōri wo izuru', 'Os peixes sobem por entre o gelo', 'Fish emerge from the ice'],
  [2, 19, '土脉潤起', 'tsuchi no shō uruoi okoru', 'A chuva umedece a terra', 'Rain moistens the soil'],
  [2, 24, '霞始靆', 'kasumi hajimete tanabiku', 'A névoa começa a pairar', 'Mist starts to linger'],
  [3, 1, '草木萌動', 'sōmoku mebae izuru', 'A grama brota e as árvores ganham botões', 'Grass sprouts, trees bud'],
  [3, 6, '蟄虫啓戸', 'sugomori mushito wo hiraku', 'Os insetos saem da hibernação', 'Hibernating insects surface'],
  [3, 11, '桃始笑', 'momo hajimete saku', 'Os primeiros pessegueiros florescem', 'First peach blossoms'],
  [3, 16, '菜虫化蝶', 'namushi chō to naru', 'As lagartas viram borboletas', 'Caterpillars become butterflies'],
  [3, 21, '雀始巣', 'suzume hajimete sukuu', 'Os pardais começam a fazer ninho', 'Sparrows start to nest'],
  [3, 26, '櫻始開', 'sakura hajimete saku', 'As primeiras cerejeiras florescem', 'First cherry blossoms'],
  [3, 31, '雷乃発声', 'kaminari sunawachi koe wo hassu', 'Trovões ao longe', 'Distant thunder'],
  [4, 5, '玄鳥至', 'tsubame kitaru', 'As andorinhas voltam', 'Swallows return'],
  [4, 10, '鴻雁北', 'kōgan kaeru', 'Os gansos selvagens voam para o norte', 'Wild geese fly north'],
  [4, 15, '虹始見', 'niji hajimete arawaru', 'Os primeiros arco-íris', 'First rainbows'],
  [4, 20, '葭始生', 'ashi hajimete shōzu', 'Os primeiros juncos brotam', 'First reeds sprout'],
  [4, 25, '霜止出苗', 'shimo yamite nae izuru', 'Última geada, as mudas de arroz crescem', 'Last frost, rice seedlings grow'],
  [4, 30, '牡丹華', 'botan hana saku', 'As peônias florescem', 'Peonies bloom'],
  [5, 5, '蛙始鳴', 'kawazu hajimete naku', 'Os sapos começam a cantar', 'Frogs start singing'],
  [5, 10, '蚯蚓出', 'mimizu izuru', 'As minhocas sobem à superfície', 'Worms surface'],
  [5, 15, '竹笋生', 'takenoko shōzu', 'Os brotos de bambu nascem', 'Bamboo shoots sprout'],
  [5, 21, '蚕起食桑', 'kaiko okite kuwa wo hamu', 'Os bichos-da-seda comem amoreira', 'Silkworms feast on mulberry leaves'],
  [5, 26, '紅花栄', 'benibana sakau', 'O cártamo floresce', 'Safflowers bloom'],
  [5, 31, '麦秋至', 'mugi no toki itaru', 'O trigo amadurece e é colhido', 'Wheat ripens and is harvested'],
  [6, 6, '蟷螂生', 'kamakiri shōzu', 'Os louva-a-deus nascem', 'Praying mantises hatch'],
  [6, 11, '腐草為螢', 'kusaretaru kusa hotaru to naru', 'Da grama úmida surgem os vaga-lumes', 'Rotten grass becomes fireflies'],
  [6, 16, '梅子黄', 'ume no mi kibamu', 'As ameixas amarelam', 'Plums turn yellow'],
  [6, 21, '乃東枯', 'natsukarekusa karuru', 'A erva-férrea murcha', 'Self-heal withers'],
  [6, 26, '菖蒲華', 'ayame hana saku', 'As íris florescem', 'Irises bloom'],
  [7, 2, '半夏生', 'hange shōzu', 'O hange brota', 'Crow-dipper sprouts'],
  [7, 7, '温風至', 'atsukaze itaru', 'Sopram ventos quentes', 'Warm winds blow'],
  [7, 12, '蓮始開', 'hasu hajimete hiraku', 'As primeiras flores de lótus abrem', 'First lotus blossoms'],
  [7, 17, '鷹乃学習', 'taka sunawachi waza wo narau', 'Os falcões aprendem a voar', 'Hawks learn to fly'],
  [7, 23, '桐始結花', 'kiri hajimete hana wo musubu', 'As paulównias dão sementes', 'Paulownia trees produce seeds'],
  [7, 28, '土潤溽暑', 'tsuchi uruōte mushi atsushi', 'A terra úmida, o ar abafado', 'Earth is damp, air is humid'],
  [8, 2, '大雨時行', 'taiu tokidoki furu', 'Às vezes caem grandes chuvas', 'Great rains sometimes fall'],
  [8, 7, '涼風至', 'suzukaze itaru', 'Sopram ventos frescos', 'Cool winds blow'],
  [8, 12, '寒蝉鳴', 'higurashi naku', 'As cigarras do entardecer cantam', 'Evening cicadas sing'],
  [8, 17, '蒙霧升降', 'fukaki kiri matō', 'A névoa espessa desce', 'Thick fog descends'],
  [8, 23, '綿柎開', 'wata no hana shibe hiraku', 'O algodão floresce', 'Cotton flowers bloom'],
  [8, 28, '天地始粛', 'tenchi hajimete samushi', 'O calor começa a ceder', 'Heat starts to die down'],
  [9, 2, '禾乃登', 'kokumono sunawachi minoru', 'O arroz amadurece', 'Rice ripens'],
  [9, 7, '草露白', 'kusa no tsuyu shiroshi', 'O orvalho brilha branco na grama', 'Dew glistens white on grass'],
  [9, 12, '鶺鴒鳴', 'sekirei naku', 'As alvéolas cantam', 'Wagtails sing'],
  [9, 17, '玄鳥去', 'tsubame saru', 'As andorinhas partem', 'Swallows leave'],
  [9, 23, '雷乃収声', 'kaminari sunawachi koe wo osamu', 'Os trovões se calam', 'Thunder ceases'],
  [9, 28, '蟄虫坏戸', 'mushi kakurete to wo fusagu', 'Os insetos fecham suas tocas', 'Insects hole up underground'],
  [10, 3, '水始涸', 'mizu hajimete karuru', 'Os campos são drenados', 'Farmers drain the fields'],
  [10, 8, '鴻雁来', 'kōgan kitaru', 'Os gansos selvagens voltam', 'Wild geese return'],
  [10, 13, '菊花開', 'kiku no hana hiraku', 'Os crisântemos florescem', 'Chrysanthemums bloom'],
  [10, 18, '蟋蟀在戸', 'kirigirisu to ni ari', 'Os grilos cantam junto à porta', 'Crickets chirp by the door'],
  [10, 23, '霜始降', 'shimo hajimete furu', 'A primeira geada', 'First frost'],
  [10, 28, '霎時施', 'kosame tokidoki furu', 'Às vezes cai uma garoa', 'Light rains sometimes fall'],
  [11, 2, '楓蔦黄', 'momiji tsuta kibamu', 'Os bordos e as heras amarelam', 'Maple leaves and ivy turn yellow'],
  [11, 7, '山茶始開', 'tsubaki hajimete hiraku', 'As camélias florescem', 'Camellias bloom'],
  [11, 12, '地始凍', 'chi hajimete kōru', 'A terra começa a congelar', 'Land starts to freeze'],
  [11, 17, '金盞香', 'kinsenka saku', 'Os narcisos florescem', 'Daffodils bloom'],
  [11, 22, '虹蔵不見', 'niji kakurete miezu', 'Os arco-íris se escondem', 'Rainbows hide'],
  [11, 27, '朔風払葉', 'kitakaze konoha wo harau', 'O vento norte derruba as folhas', 'North wind blows the leaves from the trees'],
  [12, 2, '橘始黄', 'tachibana hajimete kibamu', 'As tangerinas tachibana amarelam', 'Tachibana citrus turns yellow'],
  [12, 7, '閉塞成冬', 'sora samuku fuyu to naru', 'O frio se instala, começa o inverno', 'Cold sets in, winter begins'],
  [12, 12, '熊蟄穴', 'kuma ana ni komoru', 'Os ursos entram na toca', 'Bears start hibernating'],
  [12, 16, '鱖魚群', 'sake no uo muragaru', 'Os salmões sobem o rio em cardume', 'Salmon gather and swim upstream'],
  [12, 21, '乃東生', 'natsukarekusa shōzu', 'A erva-férrea brota', 'Self-heal sprouts'],
  [12, 26, '麋角解', 'sawashika no tsuno otsuru', 'Os cervos perdem os chifres', 'Deer shed their antlers'],
  [12, 31, '雪下出麦', 'yuki watarite mugi nobiru', 'O trigo brota sob a neve', 'Wheat sprouts under the snow'],
  [1, 5, '芹乃栄', 'seri sunawachi sakau', 'A salsa-japonesa floresce', 'Parsley flourishes'],
  [1, 10, '水泉動', 'shimizu atataka wo fukumu', 'As fontes descongelam', 'Springs thaw'],
  [1, 15, '雉始雊', 'kiji hajimete naku', 'Os faisões começam a chamar', 'Pheasants start to call'],
  [1, 20, '款冬華', 'fuki no hana saku', 'O fuki floresce', 'Butterburs bud'],
  [1, 25, '水沢腹堅', 'sawamizu kōri tsumeru', 'O gelo engrossa nos riachos', 'Ice thickens on streams'],
  [1, 30, '鶏始乳', 'niwatori hajimete toya ni tsuku', 'As galinhas começam a botar', 'Hens start laying eggs'],
].map(([month, day, kanji, reading, pt, en], index) => ({ index, month, day, kanji, reading, pt, en }));

// Mês e dia em Tóquio: a microestação é a do Japão, não a do visitante
export function tokyoMonthDay(date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' })
    .formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { month: get('month'), day: get('day') };
}

const key = (month, day) => month * 100 + day;

// A última microestação que já começou; antes de 5/1 o ano ainda está em 雪下出麦 (começa em 31/12)
export function microseasonFor(date) {
  const { month, day } = tokyoMonthDay(date);
  const today = key(month, day);
  let current = null;
  for (const season of MICROSEASONS) {
    const start = key(season.month, season.day);
    if (start <= today && (!current || start > key(current.month, current.day))) current = season;
  }
  return current ?? MICROSEASONS.reduce((a, b) => (key(b.month, b.day) > key(a.month, a.day) ? b : a));
}
