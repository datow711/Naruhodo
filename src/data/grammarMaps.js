export const POS_MAP = Object.freeze({
  1: '動詞',
  2: '名詞',
  3: '助詞',
  4: '形容詞',
  5: '副詞',
  6: '接続詞',
  7: '感動詞',
  8: '助動詞',
  9: 'その他',
});

export const POS_COLOR_MAP = Object.freeze({
  1: '#fa520f',
  2: '#6a6a6a',
  3: '#1a8b9d',
  4: '#7352b3',
  5: '#d9487c',
  6: '#d9487c',
  7: '#8a8a8a',
  8: '#fa520f',
  9: '#8a8a8a',
});

export const CONJ_MAP = Object.freeze({
  1: '未然形',
  2: '連用形',
  3: '終止形',
  4: '連體形',
  5: '仮定形',
  6: '命令形',
  7: '意向形',
  10: 'て形',
  11: 'た形',
  12: 'ない形',
});

export const CONJ_LESSON_MAP = Object.freeze({
  1: {
    level: 'N5',
    title: '未然形',
    summary: '用來接否定、意志、被動、使役等的基底。',
    focus: '先把「還沒完成、還能接續」的感覺記住。',
  },
  2: {
    level: 'N5',
    title: '連用形',
    summary: '最常接ます、た、て、たい等。',
    focus: '這是初學最常遇到的接續形。',
  },
  3: {
    level: 'N5',
    title: '終止形',
    summary: '句子結尾的基本原形。',
    focus: '字典形與敘述句的核心。',
  },
  4: {
    level: 'N5',
    title: '連體形',
    summary: '用來修飾名詞。',
    focus: '看到名詞前面的形態，就先想到這個用法。',
  },
  5: {
    level: 'N4',
    title: '仮定形',
    summary: '表示如果、假設、條件。',
    focus: '常和 ば、たら、なら 的理解一起學。',
  },
  6: {
    level: 'N4',
    title: '命令形',
    summary: '表示命令、指示或強烈要求。',
    focus: '口語和指令語氣會很明顯。',
  },
  7: {
    level: '補充',
    title: '意向形',
    summary: '表示想做、邀約或意志。',
    focus: 'N5/N4 後可以再細分學習。',
  },
  10: {
    level: 'N5',
    title: 'て形',
    summary: '用來連接動作、請求、進行式等。',
    focus: '這是 N5 很重要的活用，常接ください、います。',
  },
  11: {
    level: 'N5',
    title: 'た形',
    summary: '表示過去、完成，或接たことがあります。',
    focus: '和て形變化規則很接近，可以一起記。',
  },
  12: {
    level: 'N5',
    title: 'ない形',
    summary: '表示否定，也可接ないでください。',
    focus: '先掌握「不做」的基本意思。',
  },
});

const FALLBACK_CONJ_LESSON = Object.freeze({
  level: '補充',
  title: '特殊活用',
  summary: '模型回傳的特殊型態。',
  focus: '先看句子上下文，再對照詞性判斷。',
});

const formatCodeMap = (map) => (
  Object.entries(map)
    .map(([code, label]) => `${code}:${label}`)
    .join(', ')
);

export const POS_SCHEMA_DESCRIPTION = `POS code: ${formatCodeMap(POS_MAP)}`;
export const CONJ_SCHEMA_DESCRIPTION = `Mapping of CONJ code (string) to word. Codes: ${formatCodeMap(CONJ_MAP)}`;

export const getPosName = (code) => POS_MAP[code] || POS_MAP[9];
export const getPosColor = (code) => POS_COLOR_MAP[code] || POS_COLOR_MAP[9];
export const getConjLesson = (code) => CONJ_LESSON_MAP[code] || FALLBACK_CONJ_LESSON;

export const getConjLevelGroup = (code) => {
  const lesson = getConjLesson(code);
  return lesson.level === 'N5' || lesson.level === 'N4' ? lesson.level : '補充';
};
