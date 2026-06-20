import { analyzeSentence, translateToJapanese } from '../gemini';
import { AnalysisValidationError, normalizeAnalysisResult } from './analysisResult';

export class AnalysisFlowError extends Error {
  constructor({ code, step, message, userMessage, cause }) {
    super(message);
    this.name = 'AnalysisFlowError';
    this.code = code;
    this.step = step;
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

export function detectJapaneseInput(text) {
  const normalized = text.trim();
  const hasKana = /[\u3040-\u309f\u30a0-\u30ff\uff65-\uff9f]/.test(normalized);
  const hasKanji = /[\u3400-\u9fff]/.test(normalized);
  const hasJapanesePunctuation = /[。、！？「」『』ー]/.test(normalized);

  return {
    hasKana,
    hasKanji,
    hasJapanesePunctuation,
    isLikelyJapanese: hasKana || (hasKanji && hasJapanesePunctuation),
  };
}

const createFlowError = (step, cause) => {
  if (cause instanceof AnalysisValidationError) {
    return new AnalysisFlowError({
      code: cause.code,
      step,
      message: cause.message,
      userMessage: cause.userMessage,
      cause,
    });
  }

  const message = cause?.message || 'Unknown analysis error.';
  const code = step === 'translate' ? 'translation_failed' : 'analysis_failed';
  const userMessage = step === 'translate'
    ? '翻譯成日文時失敗，請稍後再試或直接輸入日文。'
    : 'AI 分析時失敗，請稍後再試。';

  return new AnalysisFlowError({
    code,
    step,
    message,
    userMessage,
    cause,
  });
};

const assertUsableText = (value, step) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AnalysisFlowError({
      code: `${step}_empty_result`,
      step,
      message: `${step} returned an empty result.`,
      userMessage: step === 'translate'
        ? '翻譯結果是空的，請直接輸入日文或稍後再試。'
        : '分析結果是空的，請重新分析一次。',
    });
  }
};

export async function runSentenceAnalysis({ sentence, apiKey, modelName }) {
  const input = sentence.trim();
  if (!input) {
    throw new AnalysisFlowError({
      code: 'empty_input',
      step: 'input',
      message: 'Input sentence is empty.',
      userMessage: '請先輸入要分析的句子。',
    });
  }

  const detection = detectJapaneseInput(input);
  let textToAnalyze = input;
  let originalSentence = '';

  if (!detection.isLikelyJapanese) {
    try {
      textToAnalyze = await translateToJapanese(input, apiKey, modelName);
      assertUsableText(textToAnalyze, 'translate');
      originalSentence = input;
    } catch (error) {
      throw createFlowError('translate', error);
    }
  }

  try {
    const rawAnalysis = await analyzeSentence(textToAnalyze, apiKey, modelName);
    const result = normalizeAnalysisResult(rawAnalysis);

    return {
      originalSentence,
      analyzedSentence: textToAnalyze,
      detection,
      result,
      warnings: result.warnings,
    };
  } catch (error) {
    throw createFlowError('analyze', error);
  }
}
