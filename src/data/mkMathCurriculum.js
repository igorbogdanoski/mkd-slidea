// Sprint 6.1 — MK Math Curriculum mapping (G1–G9).
// Source: igorbogdanoski/math-curriculum-ai-navigator (data/grade*.json)
// Compact taxonomy with keywords used by curriculumTagger.js to suggest
// curriculum tags for any poll/quiz question.
// Schema: { id, grade, subject, topic, subtopic, keywords[] }

const MK_MATH_CURRICULUM = [
  // Grade 1
  { id: 'mk.math.g1.geom.position',  grade: 1, subject: 'math', topic: 'Геометрија',         subtopic: 'Местоположба, движење и насока', keywords: ['лево','десно','горе','долу','напред','назад','положба','насока','движење'] },
  { id: 'mk.math.g1.geom.2d',        grade: 1, subject: 'math', topic: 'Геометрија',         subtopic: '2Д форми',                       keywords: ['форма','форми','круг','квадрат','триаголник','правоаголник','страни','2д'] },
  { id: 'mk.math.g1.geom.3d',        grade: 1, subject: 'math', topic: 'Геометрија',         subtopic: '3Д форми',                       keywords: ['коцка','топка','цилиндар','конус','3д','тело'] },
  { id: 'mk.math.g1.geom.symmetry',  grade: 1, subject: 'math', topic: 'Геометрија',         subtopic: 'Симетрија',                      keywords: ['симетрија','симетричен','оска'] },
  { id: 'mk.math.g1.num.to30',       grade: 1, subject: 'math', topic: 'Броеви и броење',     subtopic: 'Броеви до 30',                   keywords: ['брои','броеви','броење','цифра','број'] },
  { id: 'mk.math.g1.num.compare',    grade: 1, subject: 'math', topic: 'Броеви и броење',     subtopic: 'Споредување',                    keywords: ['поголем','помал','еднаков','помеѓу','подреди'] },
  { id: 'mk.math.g1.num.parity',     grade: 1, subject: 'math', topic: 'Броеви и броење',     subtopic: 'Парни и непарни броеви',         keywords: ['парен','непарен','парни','непарни'] },
  { id: 'mk.math.g1.op.addsub10',    grade: 1, subject: 'math', topic: 'Операции со броеви', subtopic: 'Собирање и одземање до 10',     keywords: ['собери','одземи','плус','минус','збир','разлика'] },
  { id: 'mk.math.g1.op.addsub20',    grade: 1, subject: 'math', topic: 'Операции со броеви', subtopic: 'Собирање и одземање до 20',     keywords: ['собирање','одземање','до 20'] },
  { id: 'mk.math.g1.op.double',      grade: 1, subject: 'math', topic: 'Операции со броеви', subtopic: 'Удвојување и преполовување',     keywords: ['удвој','преполови','половина','двојно'] },
  { id: 'mk.math.g1.meas.money',     grade: 1, subject: 'math', topic: 'Мерење',              subtopic: 'Пари',                           keywords: ['денар','пари','монета','банкнота'] },
  { id: 'mk.math.g1.meas.length',    grade: 1, subject: 'math', topic: 'Мерење',              subtopic: 'Должина, маса, зафатнина',       keywords: ['должина','маса','зафатнина','измери','тежина'] },
  { id: 'mk.math.g1.meas.time',      grade: 1, subject: 'math', topic: 'Мерење',              subtopic: 'Време',                          keywords: ['време','час','минути','ден','недела','месец'] },
  { id: 'mk.math.g1.data.tables',    grade: 1, subject: 'math', topic: 'Работа со податоци', subtopic: 'Табели и дијаграми',             keywords: ['табела','дијаграм','венов','керолов','пиктограм','столбест'] },

  // Grade 2
  { id: 'mk.math.g2.num.to100',      grade: 2, subject: 'math', topic: 'Броеви и броење',     subtopic: 'Броеви до 100',                  keywords: ['до 100','двоцифрен','десетки','единици'] },
  { id: 'mk.math.g2.op.addsub100',   grade: 2, subject: 'math', topic: 'Операции со броеви', subtopic: 'Собирање и одземање до 100',     keywords: ['собери','одземи','стотка','двоцифрен'] },
  { id: 'mk.math.g2.op.multdiv',     grade: 2, subject: 'math', topic: 'Операции со броеви', subtopic: 'Множење и делење (вовед)',       keywords: ['помножи','подели','производ','количник','множење','делење'] },
  { id: 'mk.math.g2.geom.angles',    grade: 2, subject: 'math', topic: 'Геометрија',         subtopic: 'Агли',                           keywords: ['агол','прав агол','остар','тап'] },
  { id: 'mk.math.g2.meas.length',    grade: 2, subject: 'math', topic: 'Мерење',              subtopic: 'Стандардни единици (cm, m)',     keywords: ['cm','m','сантиметар','метар','должина'] },

  // Grade 3
  { id: 'mk.math.g3.num.to1000',     grade: 3, subject: 'math', topic: 'Броеви',              subtopic: 'Броеви до 1000',                 keywords: ['до 1000','трицифрен','стотки'] },
  { id: 'mk.math.g3.op.multtable',   grade: 3, subject: 'math', topic: 'Операции',            subtopic: 'Таблица за множење',             keywords: ['таблица','множење','помножи','множи'] },
  { id: 'mk.math.g3.frac.intro',     grade: 3, subject: 'math', topic: 'Дропки',              subtopic: 'Дропки (вовед)',                 keywords: ['дропка','дропки','половина','четвртина','третина'] },
  { id: 'mk.math.g3.geom.perimeter', grade: 3, subject: 'math', topic: 'Геометрија',         subtopic: 'Периметар',                      keywords: ['периметар','обиколка','страна'] },

  // Grade 4
  { id: 'mk.math.g4.num.to10000',    grade: 4, subject: 'math', topic: 'Броеви',              subtopic: 'Броеви до 10 000',               keywords: ['до 10000','четирицифрен','илјадарка'] },
  { id: 'mk.math.g4.op.divrem',      grade: 4, subject: 'math', topic: 'Операции',            subtopic: 'Делење со остаток',              keywords: ['остаток','подели','делител','делив'] },
  { id: 'mk.math.g4.frac.ops',       grade: 4, subject: 'math', topic: 'Дропки',              subtopic: 'Операции со дропки',             keywords: ['дропка','собери дропки','одземи дропки','еднакви дропки'] },
  { id: 'mk.math.g4.geom.area',      grade: 4, subject: 'math', topic: 'Геометрија',         subtopic: 'Плоштина',                       keywords: ['плоштина','површина','m2','cm2','правоаголник','квадрат'] },
  { id: 'mk.math.g4.meas.time',      grade: 4, subject: 'math', topic: 'Мерење',              subtopic: 'Време (часовник 24h)',           keywords: ['часовник','24 часа','am','pm','секунда'] },

  // Grade 5
  { id: 'mk.math.g5.num.decimals',   grade: 5, subject: 'math', topic: 'Броеви',              subtopic: 'Децимални броеви',               keywords: ['децимален','децимална','запирка','десетинка','стотинка'] },
  { id: 'mk.math.g5.frac.mixed',     grade: 5, subject: 'math', topic: 'Дропки',              subtopic: 'Мешани броеви',                  keywords: ['мешан број','неправилна дропка'] },
  { id: 'mk.math.g5.geom.angles',    grade: 5, subject: 'math', topic: 'Геометрија',         subtopic: 'Агли (степени)',                 keywords: ['степен','агол','транспортир','прав','опружен'] },
  { id: 'mk.math.g5.data.mean',      grade: 5, subject: 'math', topic: 'Податоци',            subtopic: 'Средна вредност',                keywords: ['средна вредност','просек','аритметичка'] },

  // Grade 6
  { id: 'mk.math.g6.num.integers',   grade: 6, subject: 'math', topic: 'Броеви',              subtopic: 'Цели броеви',                    keywords: ['цел број','негативен','позитивен','спротивен','апсолутна вредност'] },
  { id: 'mk.math.g6.num.percent',    grade: 6, subject: 'math', topic: 'Броеви',              subtopic: 'Проценти',                       keywords: ['процент','проценти','%','попуст','зголемување'] },
  { id: 'mk.math.g6.alg.expr',       grade: 6, subject: 'math', topic: 'Алгебра',             subtopic: 'Изрази со променливи',           keywords: ['променлива','израз','коефициент','x','непознат'] },
  { id: 'mk.math.g6.geom.triangles', grade: 6, subject: 'math', topic: 'Геометрија',         subtopic: 'Триаголници',                    keywords: ['триаголник','рамностран','рамнокрак','остроаголен','тапоаголен'] },

  // Grade 7
  { id: 'mk.math.g7.num.ratio',      grade: 7, subject: 'math', topic: 'Броеви',              subtopic: 'Размер и пропорција',            keywords: ['размер','пропорција','однос','скала'] },
  { id: 'mk.math.g7.alg.eq1',        grade: 7, subject: 'math', topic: 'Алгебра',             subtopic: 'Линеарни равенки',               keywords: ['равенка','реши','x =','непознат','линеарна'] },
  { id: 'mk.math.g7.geom.circle',    grade: 7, subject: 'math', topic: 'Геометрија',         subtopic: 'Кружница и круг',                keywords: ['кружница','круг','радиус','дијаметар','π','пи'] },
  { id: 'mk.math.g7.prob.intro',     grade: 7, subject: 'math', topic: 'Веројатност',         subtopic: 'Веројатност (вовед)',            keywords: ['веројатност','случај','исход','можност'] },

  // Grade 8
  { id: 'mk.math.g8.alg.eq2',        grade: 8, subject: 'math', topic: 'Алгебра',             subtopic: 'Системи равенки',                keywords: ['систем','равенки','две променливи','супституција'] },
  { id: 'mk.math.g8.alg.linfn',      grade: 8, subject: 'math', topic: 'Алгебра',             subtopic: 'Линеарна функција',              keywords: ['функција','линеарна','y = kx','график','наклон'] },
  { id: 'mk.math.g8.geom.pythag',    grade: 8, subject: 'math', topic: 'Геометрија',         subtopic: 'Питагорова теорема',             keywords: ['питагора','хипотенуза','катета','правоаголен триаголник'] },
  { id: 'mk.math.g8.geom.volume',    grade: 8, subject: 'math', topic: 'Геометрија',         subtopic: 'Волумен',                        keywords: ['волумен','зафатнина','коцка','квадар','цилиндар'] },

  // Grade 9
  { id: 'mk.math.g9.alg.quad',       grade: 9, subject: 'math', topic: 'Алгебра',             subtopic: 'Квадратни равенки',              keywords: ['квадратна','дискриминанта','x²','коефициент','решение'] },
  { id: 'mk.math.g9.alg.fn',         grade: 9, subject: 'math', topic: 'Алгебра',             subtopic: 'Функции (квадратна, експоненцијална)', keywords: ['квадратна функција','парабола','експоненцијална','лог'] },
  { id: 'mk.math.g9.trig.intro',     grade: 9, subject: 'math', topic: 'Тригонометрија',      subtopic: 'Тригонометрија (вовед)',         keywords: ['синус','косинус','тангенс','sin','cos','tg','tan'] },
  { id: 'mk.math.g9.stat.disp',      grade: 9, subject: 'math', topic: 'Статистика',          subtopic: 'Мерки на дисперзија',            keywords: ['медијана','модус','опсег','стандардно отстапување','варијанса'] },
];

// Tag every primary entry with track='primary' so combined queries can filter.
for (const t of MK_MATH_CURRICULUM) {
  if (!t.track) t.track = 'primary';
}

import MK_MATH_SECONDARY_CURRICULUM, { SECONDARY_TRACKS } from './mkMathSecondaryCurriculum';

// Combined taxonomy used by the tagger and the picker.
export const MK_MATH_ALL_CURRICULUM = [...MK_MATH_CURRICULUM, ...MK_MATH_SECONDARY_CURRICULUM];

export const TRACKS = [
  { id: 'primary', label: 'Основно' },
  ...SECONDARY_TRACKS,
];

export default MK_MATH_ALL_CURRICULUM;

export const getCurriculumById = (id) => MK_MATH_ALL_CURRICULUM.find((t) => t.id === id) || null;
export const listGrades = (track = null) => {
  const pool = track ? MK_MATH_ALL_CURRICULUM.filter((t) => t.track === track) : MK_MATH_ALL_CURRICULUM;
  return Array.from(new Set(pool.map((t) => t.grade))).sort((a, b) => a - b);
};
export const listSubjects = () => Array.from(new Set(MK_MATH_ALL_CURRICULUM.map((t) => t.subject)));
export const listTracks = () => TRACKS;
