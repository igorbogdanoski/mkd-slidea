// Sprint 6.1 (extension) — MK Math Secondary Curriculum (X–XIII).
// Source: igorbogdanoski/math-curriculum-ai-navigator (data/secondary/*.ts)
// Tracks:
//   - gymnasium       (X–XIII, 4 yrs general)
//   - vocational4     (X–XIII, 4 yrs vocational)
//   - vocational3     (X–XII,  3 yrs vocational, compact)
//   - vocational2     (X–XI,   2 yrs vocational, compact)
// Schema: { id, grade, track, subject, topic, subtopic, keywords[] }

const MK_MATH_SECONDARY_CURRICULUM = [
  // ─── GYMNASIUM X (G10) ───────────────────────────────────────────────
  { id: 'mk.math.gym.g10.num.sets',     grade: 10, track: 'gymnasium', subject: 'math', topic: 'Броеви', subtopic: 'Множества и реални броеви', keywords: ['множество','подмножество','унија','пресек','венов','реални броеви','интервал','апсолутна вредност'] },
  { id: 'mk.math.gym.g10.num.percent',  grade: 10, track: 'gymnasium', subject: 'math', topic: 'Броеви', subtopic: 'Размер, пропорција, процент, камата', keywords: ['размер','пропорција','процент','тројно правило','камата','ддв','попуст','делбена сметка'] },
  { id: 'mk.math.gym.g10.alg.power',    grade: 10, track: 'gymnasium', subject: 'math', topic: 'Алгебра', subtopic: 'Степени и корени', keywords: ['степен','корен','показател','научен запис','рационален показател'] },
  { id: 'mk.math.gym.g10.alg.poly',     grade: 10, track: 'gymnasium', subject: 'math', topic: 'Алгебра', subtopic: 'Полиноми и формули за скратено множење', keywords: ['полином','моном','бином','скратено множење','разложување','нзд полином'] },
  { id: 'mk.math.gym.g10.alg.fract',    grade: 10, track: 'gymnasium', subject: 'math', topic: 'Алгебра', subtopic: 'Алгебарски (рационални) дропки', keywords: ['алгебарска дропка','дефинициона област','упрости','рационален израз'] },
  { id: 'mk.math.gym.g10.geom.coord',   grade: 10, track: 'gymnasium', subject: 'math', topic: 'Геометрија', subtopic: 'Декартов координатен систем', keywords: ['декартов','координати','растојание меѓу точки','средишна точка'] },
  { id: 'mk.math.gym.g10.fn.linear',    grade: 10, track: 'gymnasium', subject: 'math', topic: 'Функции', subtopic: 'Линеарна и степенска функција', keywords: ['линеарна функција','коефициент на правец','паралелност','нормалност','степенска функција'] },
  { id: 'mk.math.gym.g10.eq.linear',    grade: 10, track: 'gymnasium', subject: 'math', topic: 'Алгебра', subtopic: 'Линеарни равенки и неравенки', keywords: ['линеарна равенка','неравенка','параметар','интервал','решение'] },
  { id: 'mk.math.gym.g10.eq.system',    grade: 10, track: 'gymnasium', subject: 'math', topic: 'Алгебра', subtopic: 'Систем од две линеарни равенки со две непознати', keywords: ['систем','две непознати','замена','спротивни коефициенти','графички метод'] },
  { id: 'mk.math.gym.g10.geom.vec',     grade: 10, track: 'gymnasium', subject: 'math', topic: 'Геометрија', subtopic: 'Вектори', keywords: ['вектор','интензитет','колинеарни','собирање вектори','модул'] },
  { id: 'mk.math.gym.g10.trig.right',   grade: 10, track: 'gymnasium', subject: 'math', topic: 'Тригонометрија', subtopic: 'Тригонометрија во правоаголен триаголник', keywords: ['синус','косинус','тангенс','котангенс','sin','cos','tg','правоаголен триаголник'] },
  { id: 'mk.math.gym.g10.geom.2d',      grade: 10, track: 'gymnasium', subject: 'math', topic: 'Геометрија', subtopic: '2Д форми, агли, тетивен/тангентен четириаголник', keywords: ['многуаголник','тетивен','тангентен','централен агол','периферен','талес'] },
  { id: 'mk.math.gym.g10.geom.sim',     grade: 10, track: 'gymnasium', subject: 'math', topic: 'Геометрија', subtopic: 'Сличност на триаголници', keywords: ['сличност','коефициент на сличност','складни триаголници'] },
  { id: 'mk.math.gym.g10.meas.area',    grade: 10, track: 'gymnasium', subject: 'math', topic: 'Мерење', subtopic: 'Периметар и плоштина на 2Д форми', keywords: ['периметар','плоштина','круг','питагора','евклидова','талесова'] },
  { id: 'mk.math.gym.g10.meas.vol',     grade: 10, track: 'gymnasium', subject: 'math', topic: 'Мерење', subtopic: 'Плоштина и волумен на призма и цилиндар', keywords: ['призма','цилиндар','волумен','плоштина на тело'] },
  { id: 'mk.math.gym.g10.prob.intro',   grade: 10, track: 'gymnasium', subject: 'math', topic: 'Веројатност', subtopic: 'Класична и експериментална веројатност', keywords: ['веројатност','експериментална','класична','спротивен настан','релативна фреквенција'] },
  { id: 'mk.math.gym.g10.stat.basic',   grade: 10, track: 'gymnasium', subject: 'math', topic: 'Статистика', subtopic: 'Прибирање и обработка на податоци', keywords: ['аритметичка средина','медијана','мод','ранг','хистограм','пита дијаграм'] },

  // ─── GYMNASIUM XI (G11) ──────────────────────────────────────────────
  { id: 'mk.math.gym.g11.trig.right',   grade: 11, track: 'gymnasium', subject: 'math', topic: 'Тригонометрија', subtopic: 'Тригонометриски функции од остар агол', keywords: ['комплементни агли','радијан','sin 30','sin 45','sin 60','тригонометриски идентитет'] },
  { id: 'mk.math.gym.g11.num.complex',  grade: 11, track: 'gymnasium', subject: 'math', topic: 'Броеви', subtopic: 'Комплексни броеви', keywords: ['комплексен број','имагинарна единица','i','конјугиран','модул','реален дел','имагинарен дел'] },
  { id: 'mk.math.gym.g11.eq.quad',      grade: 11, track: 'gymnasium', subject: 'math', topic: 'Алгебра', subtopic: 'Квадратни равенки и Виетови формули', keywords: ['квадратна равенка','дискриминанта','виетови','x²','биквадратна','ирационална равенка'] },
  { id: 'mk.math.gym.g11.fn.quad',      grade: 11, track: 'gymnasium', subject: 'math', topic: 'Функции', subtopic: 'Квадратна функција и неравенка', keywords: ['квадратна функција','парабола','теме','квадратна неравенка'] },
  { id: 'mk.math.gym.g11.geom.constr',  grade: 11, track: 'gymnasium', subject: 'math', topic: 'Геометрија', subtopic: 'Конструкција на триаголник и четириаголник', keywords: ['конструктивна задача','симетрала','тангента','впишана кружница','опишана кружница'] },
  { id: 'mk.math.gym.g11.meas.area',    grade: 11, track: 'gymnasium', subject: 'math', topic: 'Мерење', subtopic: 'Плоштина на рамнински фигури', keywords: ['плоштина паралелограм','трапез','правилен многуаголник','кружен исечок','кружен прстен'] },
  { id: 'mk.math.gym.g11.geom.solid',   grade: 11, track: 'gymnasium', subject: 'math', topic: 'Стереометрија', subtopic: 'Плоштина и волумен на тела', keywords: ['пирамида','потсечена пирамида','конус','сфера','топка','калота','топкин појас'] },
  { id: 'mk.math.gym.g11.stat.disp',    grade: 11, track: 'gymnasium', subject: 'math', topic: 'Статистика', subtopic: 'Мерки за расејување и стандардизација', keywords: ['квартил','перцентил','дисперзија','варијанса','стандардна девијација','нормирање'] },

  // ─── GYMNASIUM XII (G12) ─────────────────────────────────────────────
  { id: 'mk.math.gym.g12.fn.exp',       grade: 12, track: 'gymnasium', subject: 'math', topic: 'Функции', subtopic: 'Експоненцијална функција и равенка', keywords: ['експоненцијална функција','експоненцијална равенка','aˣ','растење','опаѓање'] },
  { id: 'mk.math.gym.g12.fn.log',       grade: 12, track: 'gymnasium', subject: 'math', topic: 'Функции', subtopic: 'Логаритамска функција и равенка', keywords: ['логаритам','log','декаден логаритам','природен логаритам','ln','логаритамска равенка'] },
  { id: 'mk.math.gym.g12.trig.fn',      grade: 12, track: 'gymnasium', subject: 'math', topic: 'Тригонометрија', subtopic: 'Тригонометриски функции од произволен агол', keywords: ['тригонометриска кружница','ориентиран агол','период','амплитуда','тригонометриска равенка'] },
  { id: 'mk.math.gym.g12.trig.id',      grade: 12, track: 'gymnasium', subject: 'math', topic: 'Тригонометрија', subtopic: 'Адициони формули и трансформации', keywords: ['адициона формула','двоен агол','полуагол','sinα+sinβ','синусна теорема','косинусна теорема'] },
  { id: 'mk.math.gym.g12.comb',         grade: 12, track: 'gymnasium', subject: 'math', topic: 'Комбинаторика', subtopic: 'Пермутации, варијации, комбинации, биномна формула', keywords: ['пермутација','варијација','комбинација','биномна формула','паскал','математичка индукција'] },
  { id: 'mk.math.gym.g12.prob',         grade: 12, track: 'gymnasium', subject: 'math', topic: 'Веројатност', subtopic: 'Веројатност и случајни настани', keywords: ['елементарен настан','класична веројатност','статистичка веројатност','експеримент'] },
  { id: 'mk.math.gym.g12.geom.line',    grade: 12, track: 'gymnasium', subject: 'math', topic: 'Аналитичка геометрија', subtopic: 'Точка и права во рамнина', keywords: ['растојание од точка до права','равенка на права','наклон','експлицитен','сегментен','нормален вид'] },
  { id: 'mk.math.gym.g12.geom.conics',  grade: 12, track: 'gymnasium', subject: 'math', topic: 'Аналитичка геометрија', subtopic: 'Криви од втор ред (кружница, елипса, хипербола, парабола)', keywords: ['кружница','елипса','хипербола','парабола','тангента на крива','коничен пресек'] },

  // ─── GYMNASIUM XIII (G13) ────────────────────────────────────────────
  { id: 'mk.math.gym.g13.seq',          grade: 13, track: 'gymnasium', subject: 'math', topic: 'Низи', subtopic: 'Низи, аритметичка и геометриска прогресија', keywords: ['низа','аритметичка прогресија','геометриска прогресија','општ член','збир'] },
  { id: 'mk.math.gym.g13.lim.seq',      grade: 13, track: 'gymnasium', subject: 'math', topic: 'Анализа', subtopic: 'Граница на низа, број e', keywords: ['гранична вредност','лимит','конвергентна низа','број e','бескрајна геометриска','натрупување'] },
  { id: 'mk.math.gym.g13.fn.real',      grade: 13, track: 'gymnasium', subject: 'math', topic: 'Анализа', subtopic: 'Реална функција и својства', keywords: ['парност','непарност','периодичност','монотоност','инверзна функција','сложена функција'] },
  { id: 'mk.math.gym.g13.lim.fn',       grade: 13, track: 'gymnasium', subject: 'math', topic: 'Анализа', subtopic: 'Гранична вредност на функција и асимптоти', keywords: ['граница на функција','лева граница','десна граница','непрекинатост','асимптота','хоризонтална','вертикална','коса'] },
  { id: 'mk.math.gym.g13.diff',         grade: 13, track: 'gymnasium', subject: 'math', topic: 'Анализа', subtopic: 'Извод на функција (диференцијално сметање)', keywords: ['извод','диференцијал','тангента','втор извод','правило за извод','производ','количник'] },
  { id: 'mk.math.gym.g13.diff.app',     grade: 13, track: 'gymnasium', subject: 'math', topic: 'Анализа', subtopic: 'Примена на изводи (екстреми, тек, график)', keywords: ['екстрем','максимум','минимум','монотоност','конвексност','конкавност','превој','оптимизација'] },
  { id: 'mk.math.gym.g13.prob.var',     grade: 13, track: 'gymnasium', subject: 'math', topic: 'Веројатност', subtopic: 'Случајни променливи, очекување, дисперзија', keywords: ['случајна променлива','математичко очекување','распределба','условна веројатност','независност','дисперзија'] },
  { id: 'mk.math.gym.g13.stat.test',    grade: 13, track: 'gymnasium', subject: 'math', topic: 'Статистика', subtopic: 'Проверка на хипотези и тестови', keywords: ['нулта хипотеза','алтернативна хипотеза','тест-величина','грешка од прв вид','грешка од втор вид','контингенција'] },

  // ─── VOCATIONAL 4-YR X (G10) ─────────────────────────────────────────
  { id: 'mk.math.voc4.g10.logic',       grade: 10, track: 'vocational4', subject: 'math', topic: 'Логика', subtopic: 'Математичка логика и множества', keywords: ['исказ','негација','конјункција','дисјункција','импликација','еквиваленција','тавтологија','исказна функција'] },
  { id: 'mk.math.voc4.g10.num.real',    grade: 10, track: 'vocational4', subject: 'math', topic: 'Броеви', subtopic: 'Реални броеви, делимост, апсолутна вредност', keywords: ['прост број','сложен број','нзд','нзс','делимост','рационален број','ирационален','интервал','апсолутна вредност'] },
  { id: 'mk.math.voc4.g10.alg.expr',    grade: 10, track: 'vocational4', subject: 'math', topic: 'Алгебра', subtopic: 'Степени, мономи, полиноми, разложување', keywords: ['степен','моном','полином','скратено множење','разложување','алгебарска дропка'] },
  { id: 'mk.math.voc4.g10.prop',        grade: 10, track: 'vocational4', subject: 'math', topic: 'Алгебра', subtopic: 'Пропорционалност, проценти, камата', keywords: ['пропорција','тројно правило','делбена сметка','процент','каматна сметка'] },
  { id: 'mk.math.voc4.g10.eq.lin',      grade: 10, track: 'vocational4', subject: 'math', topic: 'Алгебра', subtopic: 'Линеарни равенки, неравенки и системи неравенки', keywords: ['линеарна равенка','параметар','неравенка','систем неравенки','апсолутна вредност'] },
  { id: 'mk.math.voc4.g10.fn.lin',      grade: 10, track: 'vocational4', subject: 'math', topic: 'Функции', subtopic: 'Линеарна функција и систем со две непознати', keywords: ['линеарна функција','паралелност','систем равенки','гаус','крамер','замена','изедначување'] },
  { id: 'mk.math.voc4.g10.geom.plane',  grade: 10, track: 'vocational4', subject: 'math', topic: 'Геометрија', subtopic: 'Геометриски фигури во рамнина', keywords: ['аксиома','точка','права','полуправа','отсечка','агол','круг','многуаголник'] },
  { id: 'mk.math.voc4.g10.meas.area',   grade: 10, track: 'vocational4', subject: 'math', topic: 'Мерење', subtopic: 'Плоштина и периметар на рамнински фигури', keywords: ['периметар','плоштина','паралелограм','трапез','круг','херонова формула','питагора','евклидова','талесова'] },

  // ─── VOCATIONAL 4-YR XI (G11) ────────────────────────────────────────
  { id: 'mk.math.voc4.g11.roots',       grade: 11, track: 'vocational4', subject: 'math', topic: 'Алгебра', subtopic: 'Корени и рационализација', keywords: ['корен','коренување','рационализација','степен со рационален показател'] },
  { id: 'mk.math.voc4.g11.trig',        grade: 11, track: 'vocational4', subject: 'math', topic: 'Тригонометрија', subtopic: 'Тригонометрија во правоаголен триаголник', keywords: ['тригонометриска функција','остар агол','sin','cos','tg','радијан','sin²+cos²','правоаголен'] },
  { id: 'mk.math.voc4.g11.complex',     grade: 11, track: 'vocational4', subject: 'math', topic: 'Броеви', subtopic: 'Комплексни броеви', keywords: ['комплексен број','имагинарна единица','конјугиран','модул','операции'] },
  { id: 'mk.math.voc4.g11.eq.quad',     grade: 11, track: 'vocational4', subject: 'math', topic: 'Алгебра', subtopic: 'Квадратни равенки, виетови формули', keywords: ['квадратна равенка','дискриминанта','виетови','дробно рационална','биквадратна','ирационална'] },
  { id: 'mk.math.voc4.g11.fn.quad',     grade: 11, track: 'vocational4', subject: 'math', topic: 'Функции', subtopic: 'Квадратна функција и неравенки', keywords: ['квадратна функција','каноничен вид','теме','парабола','квадратна неравенка'] },
  { id: 'mk.math.voc4.g11.geom.vec',    grade: 11, track: 'vocational4', subject: 'math', topic: 'Геометрија', subtopic: 'Вектори и геометрија во простор', keywords: ['вектор','колинеарни','просторна геометрија','паралелни рамнини','нормална права','вилкусни прави'] },
  { id: 'mk.math.voc4.g11.solids',      grade: 11, track: 'vocational4', subject: 'math', topic: 'Стереометрија', subtopic: 'Плоштина и волумен на тела', keywords: ['призма','пирамида','цилиндар','конус','топка','ротационо тело'] },

  // ─── VOCATIONAL 4-YR XII (G12) ───────────────────────────────────────
  { id: 'mk.math.voc4.g12.exp',         grade: 12, track: 'vocational4', subject: 'math', topic: 'Функции', subtopic: 'Експоненцијална функција и равенка', keywords: ['експоненцијална функција','експоненцијална равенка'] },
  { id: 'mk.math.voc4.g12.log',         grade: 12, track: 'vocational4', subject: 'math', topic: 'Функции', subtopic: 'Логаритамска функција и равенка', keywords: ['логаритам','log','логаритамска равенка','правила за логаритмирање'] },
  { id: 'mk.math.voc4.g12.trig',        grade: 12, track: 'vocational4', subject: 'math', topic: 'Тригонометрија', subtopic: 'Тригонометриски функции од произволен агол', keywords: ['тригонометриска кружница','адициона формула','тригонометриска равенка','двоен агол','полуагол'] },
  { id: 'mk.math.voc4.g12.geom.an',     grade: 12, track: 'vocational4', subject: 'math', topic: 'Аналитичка геометрија', subtopic: 'Аналитичка геометрија во рамнина', keywords: ['растојание','права','кружница','тангента','равенка на права','равенка на кружница'] },
  { id: 'mk.math.voc4.g12.comb',        grade: 12, track: 'vocational4', subject: 'math', topic: 'Комбинаторика', subtopic: 'Комбинаторика и веројатност', keywords: ['пермутација','варијација','комбинација','биномна формула','класична веројатност','условна веројатност','тотална веројатност'] },

  // ─── VOCATIONAL 4-YR XIII (G13) ──────────────────────────────────────
  { id: 'mk.math.voc4.g13.seq',         grade: 13, track: 'vocational4', subject: 'math', topic: 'Низи', subtopic: 'Низи и прогресии, гранична вредност', keywords: ['низа','аритметичка прогресија','геометриска прогресија','граница на низа','бескрајна прогресија'] },
  { id: 'mk.math.voc4.g13.fn',          grade: 13, track: 'vocational4', subject: 'math', topic: 'Анализа', subtopic: 'Елементарни реални функции', keywords: ['дефинициона област','нула на функција','монотоност','инверзна функција','периодичност'] },
  { id: 'mk.math.voc4.g13.lim',         grade: 13, track: 'vocational4', subject: 'math', topic: 'Анализа', subtopic: 'Гранична вредност на функција, асимптоти', keywords: ['граница на функција','непрекинатост','асимптота','специјални граници','sin x / x'] },
  { id: 'mk.math.voc4.g13.diff',        grade: 13, track: 'vocational4', subject: 'math', topic: 'Анализа', subtopic: 'Извод на функција и примена', keywords: ['извод','тангента','екстрем','максимум','минимум','тек на функција','оптимизација'] },

  // ─── VOCATIONAL 3-YR (G10–G12, compact) ──────────────────────────────
  { id: 'mk.math.voc3.g10.real',        grade: 10, track: 'vocational3', subject: 'math', topic: 'Броеви', subtopic: 'Реални броеви и операции', keywords: ['реални броеви','делимост','процент','пропорција','апсолутна вредност'] },
  { id: 'mk.math.voc3.g10.alg',         grade: 10, track: 'vocational3', subject: 'math', topic: 'Алгебра', subtopic: 'Алгебарски изрази и линеарни равенки', keywords: ['полином','степен','линеарна равенка','неравенка','алгебарска дропка'] },
  { id: 'mk.math.voc3.g10.geom',        grade: 10, track: 'vocational3', subject: 'math', topic: 'Геометрија', subtopic: 'Плоштина и периметар на рамнински фигури', keywords: ['плоштина','периметар','триаголник','четириаголник','круг','питагора'] },
  { id: 'mk.math.voc3.g11.quad',        grade: 11, track: 'vocational3', subject: 'math', topic: 'Алгебра', subtopic: 'Квадратни равенки и функции', keywords: ['квадратна равенка','дискриминанта','квадратна функција','парабола','теме'] },
  { id: 'mk.math.voc3.g11.trig',        grade: 11, track: 'vocational3', subject: 'math', topic: 'Тригонометрија', subtopic: 'Тригонометрија во правоаголен триаголник', keywords: ['синус','косинус','тангенс','правоаголен триаголник'] },
  { id: 'mk.math.voc3.g11.solid',       grade: 11, track: 'vocational3', subject: 'math', topic: 'Стереометрија', subtopic: 'Плоштина и волумен на тела', keywords: ['призма','пирамида','цилиндар','конус','топка','волумен'] },
  { id: 'mk.math.voc3.g12.fn',          grade: 12, track: 'vocational3', subject: 'math', topic: 'Функции', subtopic: 'Експоненцијална и логаритамска функција', keywords: ['експоненцијална','логаритам','log','равенка'] },
  { id: 'mk.math.voc3.g12.prob',        grade: 12, track: 'vocational3', subject: 'math', topic: 'Веројатност', subtopic: 'Комбинаторика и веројатност', keywords: ['пермутација','комбинација','варијација','веројатност'] },

  // ─── VOCATIONAL 2-YR (G10–G11, compact) ──────────────────────────────
  { id: 'mk.math.voc2.g10.basic',       grade: 10, track: 'vocational2', subject: 'math', topic: 'Броеви', subtopic: 'Основи: реални броеви, проценти, пропорција', keywords: ['процент','пропорција','реални броеви','камата','ддв'] },
  { id: 'mk.math.voc2.g10.linear',      grade: 10, track: 'vocational2', subject: 'math', topic: 'Алгебра', subtopic: 'Линеарни равенки и неравенки', keywords: ['линеарна равенка','неравенка','непозната','реши'] },
  { id: 'mk.math.voc2.g10.geom',        grade: 10, track: 'vocational2', subject: 'math', topic: 'Геометрија', subtopic: 'Плоштина, периметар, волумен (практично)', keywords: ['плоштина','периметар','волумен','питагора','правоаголник','круг'] },
  { id: 'mk.math.voc2.g11.quad',        grade: 11, track: 'vocational2', subject: 'math', topic: 'Алгебра', subtopic: 'Квадратни равенки и функции', keywords: ['квадратна равенка','квадратна функција','парабола'] },
  { id: 'mk.math.voc2.g11.trig',        grade: 11, track: 'vocational2', subject: 'math', topic: 'Тригонометрија', subtopic: 'Основи на тригонометрија', keywords: ['синус','косинус','тангенс','правоаголен'] },
];

export default MK_MATH_SECONDARY_CURRICULUM;

export const SECONDARY_TRACKS = [
  { id: 'gymnasium',   label: 'Гимназија' },
  { id: 'vocational4', label: 'Стручно 4-год' },
  { id: 'vocational3', label: 'Стручно 3-год' },
  { id: 'vocational2', label: 'Стручно 2-год' },
];
