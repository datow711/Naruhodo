import { GoogleGenAI, Type } from '@google/genai';

// Conjugation form names used both in enum and UI
export const FORM_NAMES = ['未然形', '連用形', '終止形', '連體形', '假定形', '命令形', '意向形'];

const schema = {
  type: Type.OBJECT,
  properties: {
    sentenceTranslation: {
      type: Type.STRING,
      description: "The Traditional Chinese translation of the entire input sentence. Keep it concise.",
    },
    tokens: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          token: {
            type: Type.STRING,
            description: "The Japanese token from the original sentence (a few characters only).",
          },
          pos: {
            type: Type.STRING,
            enum: ["動詞", "名詞", "助詞", "形容詞", "副詞", "接続詞", "感動詞", "助動詞", "その他"],
            description: "Part of speech.",
          },
          color: {
            type: Type.STRING,
            enum: ["#fa520f", "#1a8b9d", "#7352b3", "#6a6a6a", "#d9487c", "#8a8a8a"],
            description: "Color hex: 動詞=#fa520f, 助詞=#1a8b9d, 形容詞=#7352b3, 名詞=#6a6a6a, 副詞=#d9487c, others=#8a8a8a",
          },
          jlptLevel: {
            type: Type.STRING,
            enum: ["N5", "N4", "N3", "N2", "N1", "None"],
          },
          translation: {
            type: Type.STRING,
            description: "Concise Traditional Chinese translation of just this token (1-4 characters).",
          },
          reading: {
            type: Type.STRING,
            description: "Hiragana reading of this token. If the token is already all hiragana/katakana/punctuation, return empty string. Only provide reading for tokens containing kanji.",
          },
          explanation: {
            type: Type.STRING,
            description: "One sentence in Traditional Chinese explaining the grammatical role of this token.",
          },
          conjugations: {
            type: Type.OBJECT,
            nullable: true,
            description: "For verbs/adjectives only. null for all other POS.",
            properties: {
              currentForm: {
                type: Type.STRING,
                enum: ["未然形", "連用形", "終止形", "連體形", "假定形", "命令形", "意向形", "て形", "た形", "ない形"],
                description: "The conjugation form name currently used in the sentence.",
              },
              forms: {
                type: Type.ARRAY,
                description: "List of conjugation forms. Include only forms that exist for this word.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      enum: ["未然形", "連用形", "終止形", "連體形", "假定形", "命令形", "意向形"],
                    },
                    word: {
                      type: Type.STRING,
                      description: "The complete conjugated word for this form (e.g., 食べる, 食べて). Maximum 10 characters.",
                    },
                  },
                  required: ["name", "word"],
                },
              },
            },
            required: ["currentForm", "forms"],
          },
        },
        required: ["token", "pos", "color", "jlptLevel", "reading", "translation", "explanation"],
      },
    },
  },
  required: ["sentenceTranslation", "tokens"],
};

export async function analyzeSentence(sentence, apiKey, modelName = "gemini-2.5-flash") {
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze the following Japanese sentence and return structured JSON.

For the whole sentence: provide a concise Traditional Chinese translation (sentenceTranslation).

For each token, provide:
- token: the original Japanese text
- pos: part of speech (one of the enum values)
- color: the hex color mapped to the pos
- jlptLevel: estimated JLPT level
- reading: hiragana reading of the token. If the token contains kanji, give the full hiragana reading (e.g., token="食べ" → reading="たべ"). If token is already all hiragana/katakana/punctuation, return empty string "".
- translation: short Traditional Chinese meaning (1-4 chars)
- explanation: one sentence in Traditional Chinese explaining grammatical role
- conjugations: ONLY for 動詞 and 形容詞. For all others, set to null.
  - currentForm: which conjugation form is used in the sentence (from enum)
  - forms: array of {name, word} for each existing conjugation form of this word.
    Each "word" must be the COMPLETE conjugated word, short (max 10 chars).
    Only include forms that actually exist for this verb/adjective.

Japanese sentence: ${sentence}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2,
      maxOutputTokens: 3000,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from model.");

  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const clean = (start !== -1 && end !== -1) ? text.substring(start, end + 1) : text;
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parsing Error. Raw:", text);
    throw new Error("模型回傳的格式不完整，請再試一次或更換模型。");
  }
}
