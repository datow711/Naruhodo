const POS_CODES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const JLPT_CODES = new Set([0, 1, 2, 3, 4, 5]);
const CONJ_CODES = new Set([1, 2, 3, 4, 5, 6, 7, 10, 11, 12]);

export class AnalysisValidationError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = 'AnalysisValidationError';
    this.code = 'invalid_analysis_result';
    this.issues = issues;
    this.userMessage = '分析結果格式不完整，請重新分析一次。';
  }
}

const asString = (value, fallback = '') => (
  typeof value === 'string' ? value.trim() : fallback
);

const asCode = (value, allowed, fallback) => {
  const numeric = Number(value);
  return allowed.has(numeric) ? numeric : fallback;
};

const normalizeConjugations = (rawConjugations, issues, tokenIndex) => {
  if (!rawConjugations || typeof rawConjugations !== 'object') return null;
  if (!rawConjugations.f || typeof rawConjugations.f !== 'object') return null;

  const forms = Object.entries(rawConjugations.f).reduce((acc, [code, word]) => {
    const numericCode = Number(code);
    const normalizedWord = asString(word);
    if (CONJ_CODES.has(numericCode) && normalizedWord) {
      acc[String(numericCode)] = normalizedWord;
    }
    return acc;
  }, {});

  if (Object.keys(forms).length === 0) return null;

  const currentForm = asCode(rawConjugations.cf, CONJ_CODES, Number(Object.keys(forms)[0]));
  if (!forms[String(currentForm)]) {
    issues.push(`token ${tokenIndex}: current conjugation form is not present in forms`);
  }

  return {
    cf: forms[String(currentForm)] ? currentForm : Number(Object.keys(forms)[0]),
    f: forms,
  };
};

const normalizeToken = (rawToken, index, issues) => {
  if (!rawToken || typeof rawToken !== 'object') {
    issues.push(`token ${index}: not an object`);
    return null;
  }

  const tokenText = asString(rawToken.t);
  if (!tokenText) {
    issues.push(`token ${index}: missing token text`);
    return null;
  }

  return {
    t: tokenText,
    p: asCode(rawToken.p, POS_CODES, 9),
    jl: asCode(rawToken.jl, JLPT_CODES, 0),
    r: asString(rawToken.r),
    tr: asString(rawToken.tr),
    ex: asString(rawToken.ex),
    c: normalizeConjugations(rawToken.c, issues, index),
  };
};

export function normalizeAnalysisResult(rawResult) {
  const issues = [];

  if (!rawResult || typeof rawResult !== 'object') {
    throw new AnalysisValidationError('Analysis result is not an object.', ['root: not an object']);
  }

  const sentenceTranslation = asString(rawResult.st);
  if (!sentenceTranslation) {
    issues.push('root: missing sentence translation');
  }

  if (!Array.isArray(rawResult.ts)) {
    throw new AnalysisValidationError('Analysis result is missing token array.', ['root: ts is not an array']);
  }

  const tokens = rawResult.ts
    .map((token, index) => normalizeToken(token, index, issues))
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new AnalysisValidationError('Analysis result has no usable tokens.', issues);
  }

  return {
    st: sentenceTranslation,
    ts: tokens,
    warnings: issues,
  };
}
