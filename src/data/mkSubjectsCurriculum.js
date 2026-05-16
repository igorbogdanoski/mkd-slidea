// MK Curriculum — non-math subjects (G1–G13)
// Subjects: biology, chemistry, physics, cs, history, geography, mk_language, english
// Tracks: primary (G1–G9), gymnasium (G10–G13)
// Schema: { id, grade, track, subject, topic, subtopic, keywords[] }
//
// Used by: scripts/seedCurriculum.js → curriculum_chunks table → embed-batch → RAG

export const MK_SUBJECTS_CURRICULUM = [

  // ══════════════════════════════════════════════════════════════════
  // БИОЛОГИЈА / ПРИРОДНИ НАУКИ  (primary G5–G9, gymnasium G10–G13)
  // ══════════════════════════════════════════════════════════════════

  // Primary G5 — Природни науки (воведни концепти)
  { id: 'mk.bio.g5.cell.intro',       grade: 5, track: 'primary',    subject: 'biology', topic: 'Клетка',              subtopic: 'Клетката — основна единица на животот',       keywords: ['клетка','мембрана','јадро','цитоплазма','органела','прокариот','еукариот'] },
  { id: 'mk.bio.g5.ecosys.intro',     grade: 5, track: 'primary',    subject: 'biology', topic: 'Екосистем',           subtopic: 'Жива и нежива природа',                       keywords: ['жива природа','нежива природа','екосистем','абиотски','биотски'] },
  { id: 'mk.bio.g5.plants.basic',     grade: 5, track: 'primary',    subject: 'biology', topic: 'Растенија',           subtopic: 'Градба и функции на растенијата',             keywords: ['корен','стебло','лист','цвет','плод','семе','фотосинтеза','растение'] },
  { id: 'mk.bio.g5.animals.groups',   grade: 5, track: 'primary',    subject: 'biology', topic: 'Животни',             subtopic: 'Групи на животни (класификација)',             keywords: ['цицач','птица','влекач','водоземец','риба','безрбетник','класификација'] },

  // Primary G6 — Биологија
  { id: 'mk.bio.g6.cell.division',    grade: 6, track: 'primary',    subject: 'biology', topic: 'Клетка',              subtopic: 'Делба на клетката (митоза)',                   keywords: ['митоза','делба','хромозом','фаза','интерфаза','профаза','метафаза','анафаза','телофаза'] },
  { id: 'mk.bio.g6.photosyn',         grade: 6, track: 'primary',    subject: 'biology', topic: 'Растенија',           subtopic: 'Фотосинтеза и дишење кај растенијата',        keywords: ['фотосинтеза','хлоропласт','хлорофил','јаглероден диоксид','кислород','глукоза','светлина'] },
  { id: 'mk.bio.g6.food.chain',       grade: 6, track: 'primary',    subject: 'biology', topic: 'Екосистем',           subtopic: 'Ланец на исхрана и хранливи мрежи',           keywords: ['ланец на исхрана','продуцент','консумент','декомпозитор','трофичко ниво','хранлива мрежа'] },
  { id: 'mk.bio.g6.human.body1',      grade: 6, track: 'primary',    subject: 'biology', topic: 'Човеков организам',   subtopic: 'Органски системи (вовед)',                    keywords: ['орган','органски систем','ткиво','скелетен','дигестивен','нервен','циркулаторен'] },

  // Primary G7 — Биологија
  { id: 'mk.bio.g7.genetics.intro',   grade: 7, track: 'primary',    subject: 'biology', topic: 'Генетика',            subtopic: 'Наследување, ДНК и гени (вовед)',             keywords: ['ДНК','ген','хромозом','наследување','фенотип','генотип','мендел','доминантен','рецесивен'] },
  { id: 'mk.bio.g7.human.body2',      grade: 7, track: 'primary',    subject: 'biology', topic: 'Човеков организам',   subtopic: 'Дигестивен и дишен систем',                   keywords:['варење','дигестија','желудник','цревo','плуќа','кислород','дишење','ензим'] },
  { id: 'mk.bio.g7.microorg',         grade: 7, track: 'primary',    subject: 'biology', topic: 'Микроорганизми',      subtopic: 'Бактерии, вируси и габи',                     keywords: ['бактерија','вирус','габа','инфекција','антибиотик','имунитет','микроорганизам'] },
  { id: 'mk.bio.g7.evolution.basic',  grade: 7, track: 'primary',    subject: 'biology', topic: 'Еволуција',           subtopic: 'Еволуција и природна селекција (вовед)',      keywords: ['еволуција','природна селекција','дарвин','адаптација','видови','мутација','опстанок'] },

  // Primary G8–G9 — Биологија
  { id: 'mk.bio.g8.human.repro',      grade: 8, track: 'primary',    subject: 'biology', topic: 'Човеков организам',   subtopic: 'Репродуктивен систем и развиток',             keywords: ['репродукција','оплодување','развиток','ембрион','полово созревање','хормони'] },
  { id: 'mk.bio.g8.ecology',          grade: 8, track: 'primary',    subject: 'biology', topic: 'Екологија',           subtopic: 'Загадување и заштита на животната средина',   keywords: ['загадување','екологија','заштита','климатски промени','биодиверзитет','одржлив развој'] },
  { id: 'mk.bio.g9.cell.advanced',    grade: 9, track: 'primary',    subject: 'biology', topic: 'Клетка',              subtopic: 'Клеточен метаболизам и енергија',             keywords: ['метаболизам','АТФ','митохондрија','аеробно','анаеробно','дишење','клеточна енергија'] },

  // Gymnasium G10–G13 — Биологија
  { id: 'mk.bio.gym.g10.biochem',     grade: 10, track: 'gymnasium', subject: 'biology', topic: 'Биохемија',           subtopic: 'Биомолекули: јаглехидрати, протеини, липиди, нуклеински киселини', keywords: ['јаглехидрат','протеин','амино киселина','липид','нуклеинска киселина','ДНК','РНК','ензим','метаболит'] },
  { id: 'mk.bio.gym.g10.cell.adv',    grade: 10, track: 'gymnasium', subject: 'biology', topic: 'Клетка',              subtopic: 'Органели и клеточен транспорт',               keywords: ['органела','рибозом','ендоплазматичен ретикулум','голџи','лизозом','осмоза','дифузија','активен транспорт'] },
  { id: 'mk.bio.gym.g11.genetics',    grade: 11, track: 'gymnasium', subject: 'biology', topic: 'Генетика',            subtopic: 'Менделска и молекуларна генетика',            keywords: ['менделска генетика','моносхибриден','дихибриден','кршење','менделови закони','ДНК репликација','транскрипција','транслација'] },
  { id: 'mk.bio.gym.g11.evolution',   grade: 11, track: 'gymnasium', subject: 'biology', topic: 'Еволуција',           subtopic: 'Синтетичка теорија на еволуција',             keywords: ['неодарвинизам','генски базен','генетски дрифт','природна селекција','видообразување','алопатричко','симпатричко'] },
  { id: 'mk.bio.gym.g12.ecology',     grade: 12, track: 'gymnasium', subject: 'biology', topic: 'Екологија',           subtopic: 'Популациска и екосистемска екологија',        keywords: ['популација','биоценоза','биотоп','носечки капацитет','биогеохемиски циклус','азот','јаглерод','сукцесија'] },
  { id: 'mk.bio.gym.g12.physiology',  grade: 12, track: 'gymnasium', subject: 'biology', topic: 'Физиологија',         subtopic: 'Физиологија на растенија и животни',          keywords: ['транспирација','транспорт кај растенија','хормони кај животни','нервен импулс','хомеостаза','акционен потенцијал'] },
  { id: 'mk.bio.gym.g13.biotech',     grade: 13, track: 'gymnasium', subject: 'biology', topic: 'Биотехнологија',      subtopic: 'ГМО, клонирање, PCR, генетски инженеринг',   keywords: ['генетски инженеринг','ГМО','клонирање','PCR','CRISPR','рекомбинантна ДНК','биотехнологија','стем клетки'] },

  // ══════════════════════════════════════════════════════════════════
  // ХЕМИЈА  (primary G7–G9, gymnasium G10–G13)
  // ══════════════════════════════════════════════════════════════════

  { id: 'mk.chem.g7.matter.basic',    grade: 7, track: 'primary',    subject: 'chemistry', topic: 'Материја',           subtopic: 'Материја, супстанции и мешавини',            keywords: ['материја','супстанција','мешавина','чиста супстанција','смес','елемент','соединение','хомогена','хетерогена'] },
  { id: 'mk.chem.g7.atom.basic',      grade: 7, track: 'primary',    subject: 'chemistry', topic: 'Атомска структура',  subtopic: 'Атом, молекул, протон, неутрон, електрон',   keywords: ['атом','молекул','протон','неутрон','електрон','јадро','орбита','атомски број','масен број'] },
  { id: 'mk.chem.g7.periodic',        grade: 7, track: 'primary',    subject: 'chemistry', topic: 'Периоден систем',    subtopic: 'Периоден систем на елементите (вовед)',       keywords: ['периоден систем','елемент','метал','неметал','период','група','менделеев','симбол'] },
  { id: 'mk.chem.g8.bond.basic',      grade: 8, track: 'primary',    subject: 'chemistry', topic: 'Хемиска врска',      subtopic: 'Јонска и ковалентна врска',                   keywords: ['хемиска врска','јонска врска','ковалентна врска','јон','катјон','анјон','електроваленција','молекулска'] },
  { id: 'mk.chem.g8.reaction.basic',  grade: 8, track: 'primary',    subject: 'chemistry', topic: 'Хемиска реакција',   subtopic: 'Видови хемиски реакции и равенки',           keywords: ['хемиска реакција','равенка','реактант','производ','синтеза','разложување','замена','егзотермна','ендотермна'] },
  { id: 'mk.chem.g8.acid.base',       grade: 8, track: 'primary',    subject: 'chemistry', topic: 'Киселини и бази',    subtopic: 'Киселини, бази и неутрализација',            keywords: ['киселина','база','ph','неутрализација','сол','индикатор','лакмус','хидроксид','водороден јон'] },
  { id: 'mk.chem.g9.organic.intro',   grade: 9, track: 'primary',    subject: 'chemistry', topic: 'Органска хемија',    subtopic: 'Јаглеводороди (вовед)',                       keywords: ['органска хемија','јаглеводород','алкан','алкен','алкин','метан','етан','пропан','бутан','хомологна низа'] },
  { id: 'mk.chem.gym.g10.stoich',     grade: 10, track: 'gymnasium', subject: 'chemistry', topic: 'Стехиометрија',      subtopic: 'Мол, авогадро, стехиометриски пресметки',    keywords: ['мол','авогадро','молекулска маса','стехиометрија','масен удел','принос','концентрација','мол/л'] },
  { id: 'mk.chem.gym.g10.thermo',     grade: 10, track: 'gymnasium', subject: 'chemistry', topic: 'Термохемија',        subtopic: 'Топлина на реакција, хесов закон',           keywords: ['термохемија','ентапија','хесов закон','топлина','калориметар','егзотермна','ендотермна','стандардна ентапија'] },
  { id: 'mk.chem.gym.g11.kinetics',   grade: 11, track: 'gymnasium', subject: 'chemistry', topic: 'Кинетика',           subtopic: 'Брзина на реакција и рамнотежа',             keywords: ['брзина на реакција','катализатор','концентрација','температура','ле шателје','рамнотежа','константа','кинетика'] },
  { id: 'mk.chem.gym.g11.electro',    grade: 11, track: 'gymnasium', subject: 'chemistry', topic: 'Електрохемија',      subtopic: 'Електролиза и галвански елемент',            keywords: ['електролиза','електролит','анода','катода','галвански елемент','редокс','оксидација','редукција','оксидациски број'] },
  { id: 'mk.chem.gym.g12.organic',    grade: 12, track: 'gymnasium', subject: 'chemistry', topic: 'Органска хемија',    subtopic: 'Функционални групи и реакции',               keywords: ['алкохол','алдехид','кетон','карбоксилна киселина','естер','амин','функционална група','нуклеофил','електрофил','SN'] },
  { id: 'mk.chem.gym.g13.polymer',    grade: 13, track: 'gymnasium', subject: 'chemistry', topic: 'Полимери',           subtopic: 'Природни и синтетски полимери, биополимери',  keywords: ['полимер','мономер','полимеризација','пластика','гума','влакна','целулоза','протеин','ДНК','биополимер'] },

  // ══════════════════════════════════════════════════════════════════
  // ФИЗИКА  (primary G6–G9, gymnasium G10–G13)
  // ══════════════════════════════════════════════════════════════════

  { id: 'mk.phy.g6.force.basic',      grade: 6, track: 'primary',    subject: 'physics', topic: 'Сили',               subtopic: 'Сила, маса, тежина (Њутнови закони, вовед)',  keywords: ['сила','маса','тежина','Њутн','тежина','гравитација','фрикција','нормална сила'] },
  { id: 'mk.phy.g6.motion.basic',     grade: 6, track: 'primary',    subject: 'physics', topic: 'Движење',            subtopic: 'Брзина, забрзување и рамномерно движење',    keywords: ['брзина','забрзување','рамномерно движење','траектофрија','растојание','патека','v=s/t'] },
  { id: 'mk.phy.g7.energy.basic',     grade: 7, track: 'primary',    subject: 'physics', topic: 'Енергија',           subtopic: 'Кинетичка, потенцијална и механичка енергија', keywords: ['кинетичка енергија','потенцијална енергија','механичка енергија','работа','ватман','џул'] },
  { id: 'mk.phy.g7.heat.basic',       grade: 7, track: 'primary',    subject: 'physics', topic: 'Топлина',            subtopic: 'Температура, топлина и агрегатни состојби',   keywords: ['температура','топлина','Целзиус','Келвин','топење','мрзнење','испарување','кондензација','сублимација'] },
  { id: 'mk.phy.g8.electricity',      grade: 8, track: 'primary',    subject: 'physics', topic: 'Електрицитет',       subtopic: 'Електрична струја, напон и отпор (Омов закон)', keywords: ['електрична струја','напон','отпор','Омов закон','амперметар','волтметар','серија','паралела','ом','ампер','волт'] },
  { id: 'mk.phy.g8.light.optics',     grade: 8, track: 'primary',    subject: 'physics', topic: 'Оптика',             subtopic: 'Рефлексија, рефракција и леќи',               keywords: ['светлина','рефлексија','рефракција','леќа','огледало','призма','спектар','сочиво','снелов закон'] },
  { id: 'mk.phy.g9.waves.sound',      grade: 9, track: 'primary',    subject: 'physics', topic: 'Бранови',            subtopic: 'Звук, бранови и Доплеров ефект',              keywords: ['бран','звук','фреквенција','амплитуда','период','Доплер','ултразвук','инфразвук','резонанција'] },
  { id: 'mk.phy.g9.atom.radioact',    grade: 9, track: 'primary',    subject: 'physics', topic: 'Атомска физика',     subtopic: 'Радиоактивност и нуклеарна физика (вовед)',   keywords: ['радиоактивност','алфа','бета','гама','полувреме','нуклеарна реакција','фисија','фузија','јонизирачко зрачење'] },
  { id: 'mk.phy.gym.g10.mechanics',   grade: 10, track: 'gymnasium', subject: 'physics', topic: 'Механика',           subtopic: 'Кинематика и динамика (Њутнови закони)',      keywords: ['кинематика','динамика','Њутнови закони','инерција','импулс','момент','центрипетална','кружно движење','проектил'] },
  { id: 'mk.phy.gym.g11.thermody',    grade: 11, track: 'gymnasium', subject: 'physics', topic: 'Термодинамика',      subtopic: 'Гасни закони и термодинамички процеси',      keywords: ['идеален гас','Бојл-Мариот','Шарл','изотермен','изобарен','изохорен','ентропија','карно','прв закон'] },
  { id: 'mk.phy.gym.g11.em',          grade: 11, track: 'gymnasium', subject: 'physics', topic: 'Електромагнетизам',  subtopic: 'Магнетно поле и електромагнетна индукција',  keywords: ['магнетно поле','магнетна сила','ампер','фарадеј','Ленцов закон','трансформатор','генератор','наизменична'] },
  { id: 'mk.phy.gym.g12.waves',       grade: 12, track: 'gymnasium', subject: 'physics', topic: 'Бранови и оптика',   subtopic: 'Интерференција, дифракција, поларизација',   keywords: ['интерференција','дифракција','поларизација','кохерентност','ласер','бран','Хајгенс','Јунг','дифракциона решетка'] },
  { id: 'mk.phy.gym.g13.quantum',     grade: 13, track: 'gymnasium', subject: 'physics', topic: 'Квантна физика',     subtopic: 'Фотоефект, де Брољи, Хајзенберг, атомски модели', keywords: ['квантна механика','фотоефект','фотон','де Брољи','Хајзенберг','Шредингер','атомски модел','бор','квант'] },

  // ══════════════════════════════════════════════════════════════════
  // ИНФОРМАТИКА / ЦС  (primary G5–G9, gymnasium G10–G13)
  // ══════════════════════════════════════════════════════════════════

  { id: 'mk.cs.g5.digital.basics',    grade: 5, track: 'primary',    subject: 'cs', topic: 'Дигитална писменост',  subtopic: 'Компјутерски компоненти и операционен систем', keywords: ['компјутер','процесор','RAM','хард диск','операционен систем','Windows','датотека','папка'] },
  { id: 'mk.cs.g6.internet.safety',   grade: 6, track: 'primary',    subject: 'cs', topic: 'Интернет',            subtopic: 'Интернет безбедност и дигитално граѓанство',   keywords: ['интернет','безбедност','лозинка','phishing','лични податоци','cyberbullying','дигитален отпечаток'] },
  { id: 'mk.cs.g6.html.basic',        grade: 6, track: 'primary',    subject: 'cs', topic: 'Веб',                 subtopic: 'HTML основи — структура на веб страна',        keywords: ['HTML','тагови','body','head','h1','p','img','a','href','веб страна','браузер'] },
  { id: 'mk.cs.g7.programming.intro', grade: 7, track: 'primary',    subject: 'cs', topic: 'Програмирање',        subtopic: 'Алгоритми и Scratch / Python вовед',            keywords: ['алгоритам','блок код','Scratch','Python','секвенца','услов','јамка','деклараторна','процедурна'] },
  { id: 'mk.cs.g7.data.spreadsheet',  grade: 7, track: 'primary',    subject: 'cs', topic: 'Податоци',            subtopic: 'Табеларни пресметки (Excel / Sheets)',          keywords: ['Excel','табела','формула','функција','SUM','AVERAGE','ќелија','редица','колона','графикон'] },
  { id: 'mk.cs.g8.algorithms',        grade: 8, track: 'primary',    subject: 'cs', topic: 'Алгоритми',           subtopic: 'Сортирање, пребарување и сложеност',           keywords: ['сортирање','пребарување','bubble sort','linear search','binary search','сложеност','алгоритам'] },
  { id: 'mk.cs.g8.databases.intro',   grade: 8, track: 'primary',    subject: 'cs', topic: 'Бази на податоци',    subtopic: 'Релациони бази и основи на SQL',               keywords: ['база на податоци','табела','запис','поле','SQL','SELECT','WHERE','INSERT','клуч','релација'] },
  { id: 'mk.cs.g9.networks',          grade: 9, track: 'primary',    subject: 'cs', topic: 'Мрежи',               subtopic: 'Компјутерски мрежи, протоколи, IP адреса',     keywords: ['мрежа','LAN','WAN','IP адреса','TCP','UDP','HTTP','DNS','рутер','заштитен ѕид','топологија'] },
  { id: 'mk.cs.gym.g10.oop',          grade: 10, track: 'gymnasium', subject: 'cs', topic: 'Програмирање',        subtopic: 'Објектно-ориентирано програмирање (OOP)',       keywords: ['класа','објект','наследување','полиморфизам','енкапсулација','апстракција','Python','Java','метод','атрибут'] },
  { id: 'mk.cs.gym.g11.datastructs',  grade: 11, track: 'gymnasium', subject: 'cs', topic: 'Структури',           subtopic: 'Листи, стекови, редици, дрвја, графови',       keywords: ['листа','стек','редица','дрво','граф','рекурзија','BST','хеш табела','DFS','BFS'] },
  { id: 'mk.cs.gym.g12.webdev',       grade: 12, track: 'gymnasium', subject: 'cs', topic: 'Веб развој',          subtopic: 'HTML5, CSS3, JavaScript и рамки',              keywords: ['HTML5','CSS3','JavaScript','React','Node','DOM','API','fetch','JSON','responsive','frontend'] },
  { id: 'mk.cs.gym.g13.ai.intro',     grade: 13, track: 'gymnasium', subject: 'cs', topic: 'Вештачка интелигенција', subtopic: 'ML, невронски мрежи, етика на AI',          keywords: ['вештачка интелигенција','машинско учење','невронска мрежа','AI','нодa','тренирање','класификација','регресија','ChatGPT'] },

  // ══════════════════════════════════════════════════════════════════
  // ИСТОРИЈА  (primary G5–G9, gymnasium G10–G13)
  // ══════════════════════════════════════════════════════════════════

  { id: 'mk.hist.g5.ancient',         grade: 5, track: 'primary',    subject: 'history', topic: 'Античка историја',  subtopic: 'Стариот Египет, Месопотамија, Грција, Рим',  keywords: ['Египет','фараон','Месопотамија','Грција','Рим','империја','антика','цивилизација','робовладетелство'] },
  { id: 'mk.hist.g6.medieval',        grade: 6, track: 'primary',    subject: 'history', topic: 'Средновековие',     subtopic: 'Феудализам, Византија и средновековните држави', keywords: ['феудализам','витез','Византија','крстоносни походи','средновековие','вазал','монархија','Ислам'] },
  { id: 'mk.hist.g7.renaissance',     grade: 7, track: 'primary',    subject: 'history', topic: 'Нов век',           subtopic: 'Ренесанса, Реформација и Велики откритија',   keywords: ['ренесанса','хуманизам','реформација','Лутер','Колумб','откритија','штампа','Гутенберг','барок'] },
  { id: 'mk.hist.g8.revolutions',     grade: 8, track: 'primary',    subject: 'history', topic: 'Револуции',         subtopic: 'Француска револуција, индустриска револуција', keywords: ['француска револуција','Наполеон','слобода','еднаквост','индустриска револуција','пареа','капитализам','граѓанство'] },
  { id: 'mk.hist.g9.mk.history',      grade: 9, track: 'primary',    subject: 'history', topic: 'Историја на Македонија', subtopic: 'Македонија во XIX и XX век, независност',keywords: ['македонија','независност','ВМРО','Илинден','АСНОМ','НОВ','федерација','Тито','1991','реферeндум'] },
  { id: 'mk.hist.gym.g10.ww1',        grade: 10, track: 'gymnasium', subject: 'history', topic: 'Прва светска војна', subtopic: 'Причини, тек и последици на ПСВ (1914–1918)', keywords: ['прва светска војна','Сараево','тројна антанта','тројна алијанса','Западниот фронт','Версај','Вилсон','14 точки'] },
  { id: 'mk.hist.gym.g11.ww2',        grade: 11, track: 'gymnasium', subject: 'history', topic: 'Втора светска војна', subtopic: 'Фашизам, Холокауст и ВСВ (1939–1945)',       keywords: ['втора светска војна','Хитлер','нацизам','фашизам','Холокауст','Холокауст','D-Day','атомска бомба','ОН','студена војна'] },
  { id: 'mk.hist.gym.g12.cold.war',   grade: 12, track: 'gymnasium', subject: 'history', topic: 'Студена војна',     subtopic: 'Студена војна, берлински ѕид, НАТО, распаѓање на СССР', keywords: ['студена војна','НАТО','Варшавски пакт','берлински ѕид','трка во вооружување','СССР','распаѓање','1991'] },
  { id: 'mk.hist.gym.g13.globalization', grade: 13, track: 'gymnasium', subject: 'history', topic: 'Глобализација',  subtopic: 'Глобализација, ЕУ, тероризам и XXI век',     keywords: ['глобализација','ЕУ','НАТО','тероризам','11 септември','климатски промени','миграции','дигитална ера'] },

  // ══════════════════════════════════════════════════════════════════
  // ГЕОГРАФИЈА  (primary G5–G9, gymnasium G10–G13)
  // ══════════════════════════════════════════════════════════════════

  { id: 'mk.geo.g5.maps.basic',       grade: 5, track: 'primary',    subject: 'geography', topic: 'Картографија',    subtopic: 'Карти, размер, легенда и координати',         keywords: ['карта','размер','легенда','географска должина','географска широчина','меридијан','паралела','GPS','азимут'] },
  { id: 'mk.geo.g6.earth.structure',  grade: 6, track: 'primary',    subject: 'geography', topic: 'Земјата',         subtopic: 'Внатрешна структура и тектоника на плочи',   keywords: ['литосфера','хидросфера','атмосфера','биосфера','тектоника','магма','земјотрес','вулкан','плочи'] },
  { id: 'mk.geo.g7.climate',          grade: 7, track: 'primary',    subject: 'geography', topic: 'Клима',           subtopic: 'Климатски зони и временски услови',           keywords: ['клима','влажност','температура','врнежи','ветер','тропска','умерена','поларна','климограм','изотерма'] },
  { id: 'mk.geo.g8.population',       grade: 8, track: 'primary',    subject: 'geography', topic: 'Население',       subtopic: 'Население, урбанизација и миграции',          keywords: ['население','густината','раст','миграција','урбанизација','демографија','стапка','наталитет','морталитет'] },
  { id: 'mk.geo.g9.mk.geography',     grade: 9, track: 'primary',    subject: 'geography', topic: 'Македонија',      subtopic: 'Физичка и општествена географија на Македонија', keywords: ['македонија','скопје','охридско езеро','вардар','шар','пелагонија','климат','население','општини'] },
  { id: 'mk.geo.gym.g10.europe',      grade: 10, track: 'gymnasium', subject: 'geography', topic: 'Европа',          subtopic: 'Физичка и политичка географија на Европа',    keywords: ['европа','ЕУ','алпи','рајна','дунав','пиринеи','скандинавија','балкан','западна европа','источна европа'] },
  { id: 'mk.geo.gym.g11.world',       grade: 11, track: 'gymnasium', subject: 'geography', topic: 'Светска географија', subtopic: 'Континенти: Азија, Африка, Америки, Океанија', keywords: ['азија','африка','америка','Хималаи','Амазонија','Сахара','Сибир','глобален','GDP','развиени','во развој'] },
  { id: 'mk.geo.gym.g12.economics',   grade: 12, track: 'gymnasium', subject: 'geography', topic: 'Економска географија', subtopic: 'Земјоделство, индустрија, туризам, транспорт', keywords: ['земјоделство','индустрија','туризам','транспорт','глобализација','трговија','инвестиции','ресурси','БДП'] },
  { id: 'mk.geo.gym.g13.environment', grade: 13, track: 'gymnasium', subject: 'geography', topic: 'Животна средина', subtopic: 'Климатски промени, одржлив развој и геополитика', keywords: ['климатски промени','CO2','COP','одржлив развој','деградација','ерозија','обезшумување','зелена агенда','геополитика'] },

  // ══════════════════════════════════════════════════════════════════
  // МАКЕДОНСКИ ЈАЗИК И ЛИТЕРАТУРА  (G1–G9 primary, G10–G13 gymnasium)
  // ══════════════════════════════════════════════════════════════════

  { id: 'mk.mklang.g1.alphabet',      grade: 1, track: 'primary',    subject: 'mk_language', topic: 'Азбука',           subtopic: 'Македонска азбука, читање и пишување',        keywords: ['азбука','буква','самогласка','согласка','слог','читање','пишување','печатно','ракописно','кирилица'] },
  { id: 'mk.mklang.g2.sentence',      grade: 2, track: 'primary',    subject: 'mk_language', topic: 'Реченица',          subtopic: 'Реченица, зборови и интерпункција',           keywords: ['реченица','збор','точка','прашалник','извичник','запирка','предикат','субјект'] },
  { id: 'mk.mklang.g3.word.types',    grade: 3, track: 'primary',    subject: 'mk_language', topic: 'Граматика',          subtopic: 'Именки, глаголи и придавки',                  keywords: ['именка','глагол','придавка','заменка','број','прилог','определен член','неопределен'] },
  { id: 'mk.mklang.g5.morphology',    grade: 5, track: 'primary',    subject: 'mk_language', topic: 'Морфологија',        subtopic: 'Глаголи: лице, број, и вид',                  keywords: ['глагол','сегашно','минато','идно','лице','број','свршен','несвршен','вид','конјугација'] },
  { id: 'mk.mklang.g6.syntax',        grade: 6, track: 'primary',    subject: 'mk_language', topic: 'Синтакса',           subtopic: 'Реченични членови и видови реченици',         keywords: ['субјект','предикат','објект','прилошка определба','атрибут','проста','сложена реченица'] },
  { id: 'mk.mklang.g7.literature',    grade: 7, track: 'primary',    subject: 'mk_language', topic: 'Литература',         subtopic: 'Лирика, епика, драма и родови на литературата', keywords: ['лирика','епика','драма','роман','новела','приказна','поезија','рима','метафора','симбол','компаративна'] },
  { id: 'mk.mklang.g8.pravopis',      grade: 8, track: 'primary',    subject: 'mk_language', topic: 'Правопис',           subtopic: 'Правопис, пунктуација и правоговор',          keywords: ['правопис','интерпункција','зборообразување','правоговор','акцент','слог','слоговна поделба'] },
  { id: 'mk.mklang.g9.lit.analysis',  grade: 9, track: 'primary',    subject: 'mk_language', topic: 'Литература',         subtopic: 'Анализа на книжевни дела (македонски автори)', keywords: ['рачин','конески','смилевски','крле','анализа','тема','мотив','лик','сижe','фабула','стил'] },
  { id: 'mk.mklang.gym.g10.syntax2',  grade: 10, track: 'gymnasium', subject: 'mk_language', topic: 'Синтакса',           subtopic: 'Зависносложена и независносложена реченица',  keywords: ['зависносложена','независносложена','паратакса','хипотакса','временска','причинска','условна','намерна'] },
  { id: 'mk.mklang.gym.g11.rhetoric', grade: 11, track: 'gymnasium', subject: 'mk_language', topic: 'Реторика',           subtopic: 'Говорење, аргументација и реторички фигури',  keywords: ['реторика','аргумент','теза','антитеза','хипербола','метонимија','иронија','елипса','анафора','градација'] },
  { id: 'mk.mklang.gym.g12.lit.hist', grade: 12, track: 'gymnasium', subject: 'mk_language', topic: 'Историја на литературата', subtopic: 'Реализам, модернизам и постмодернизам',   keywords: ['реализам','натурализам','модернизам','постмодернизам','авангарда','надреализам','симболизам','експресионизам'] },
  { id: 'mk.mklang.gym.g13.essay',    grade: 13, track: 'gymnasium', subject: 'mk_language', topic: 'Есеј',               subtopic: 'Пишување есеј, научен стил и аргументација',  keywords: ['есеј','научен стил','аргументативен','рефerat','апстракт','цитирање','референца','академско пишување'] },

  // ══════════════════════════════════════════════════════════════════
  // АНГЛИСКИ ЈАЗИК  (G1–G9 primary, G10–G13 gymnasium)
  // ══════════════════════════════════════════════════════════════════

  { id: 'mk.eng.g1.alphabet',         grade: 1, track: 'primary',    subject: 'english', topic: 'Азбука',             subtopic: 'Англиска азбука, звуци и основни зборови',    keywords: ['alphabet','ABC','phonics','letter','sound','word','basic vocabulary','colours','numbers','animals'] },
  { id: 'mk.eng.g2.greetings',        grade: 2, track: 'primary',    subject: 'english', topic: 'Комуникација',        subtopic: 'Поздравување, претставување и прости фрази',  keywords: ['hello','my name is','how are you','good morning','please','thank you','classroom','teacher'] },
  { id: 'mk.eng.g4.present.simple',   grade: 4, track: 'primary',    subject: 'english', topic: 'Граматика',           subtopic: 'Present Simple и секојдневни активности',    keywords: ['present simple','verb','do does','he she it','daily routine','subject pronoun','negative','question'] },
  { id: 'mk.eng.g5.past.simple',      grade: 5, track: 'primary',    subject: 'english', topic: 'Граматика',           subtopic: 'Past Simple — правилни и неправилни глаголи', keywords: ['past simple','regular irregular','was were','did','yesterday','ago','narrative','story','irregular verbs'] },
  { id: 'mk.eng.g6.tenses',           grade: 6, track: 'primary',    subject: 'english', topic: 'Граматика',           subtopic: 'Present Continuous и Future (will / going to)', keywords: ['present continuous','am is are + ing','future','will','going to','plans','predictions','tense'] },
  { id: 'mk.eng.g7.conditionals',     grade: 7, track: 'primary',    subject: 'english', topic: 'Граматика',           subtopic: 'Условни реченици (0, 1, 2 conditional)',      keywords: ['conditional','if clause','zero first second conditional','would','hypothetical','real unreal'] },
  { id: 'mk.eng.g8.passive',          grade: 8, track: 'primary',    subject: 'english', topic: 'Граматика',           subtopic: 'Пасивна форма и модални глаголи',             keywords: ['passive voice','by agent','modal verb','can could must should might','obligation','ability'] },
  { id: 'mk.eng.g9.essay.writing',    grade: 9, track: 'primary',    subject: 'english', topic: 'Пишување',           subtopic: 'Есеј, имејл и формален/ неформален стил',    keywords: ['essay','paragraph','topic sentence','formal informal','email','letter','linking words','conclusion'] },
  { id: 'mk.eng.gym.g10.advanced',    grade: 10, track: 'gymnasium', subject: 'english', topic: 'Граматика',           subtopic: 'Perfect tenses и репортиран говор',           keywords: ['present perfect','past perfect','reported speech','say tell','indirect speech','narrative tense','since for'] },
  { id: 'mk.eng.gym.g11.vocabulary',  grade: 11, track: 'gymnasium', subject: 'english', topic: 'Вокабулар',          subtopic: 'Академски вокабулар и фразални глаголи',      keywords: ['phrasal verb','academic vocabulary','collocation','word formation','prefix suffix','idiom','register'] },
  { id: 'mk.eng.gym.g12.literature',  grade: 12, track: 'gymnasium', subject: 'english', topic: 'Литература',         subtopic: 'Англиска и американска литература',          keywords: ['Shakespeare','Dickens','Orwell','Hemingway','novel','poetry','theme','symbolism','literary analysis'] },
  { id: 'mk.eng.gym.g13.advanced2',   grade: 13, track: 'gymnasium', subject: 'english', topic: 'Напредна граматика',  subtopic: 'Инверзија, апозитиви, клефт реченици (C1 ниво)', keywords: ['inversion','cleft sentence','subjunctive','participle clause','advanced grammar','C1','academic writing'] },

];

export default MK_SUBJECTS_CURRICULUM;
