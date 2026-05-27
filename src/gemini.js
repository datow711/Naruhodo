import { GoogleGenAI, Type } from '@google/genai';

// --- Extensible Mapping Tables ---
export const POS_MAP = {
  1: "動詞",
  2: "名詞",
  3: "助詞",
  4: "形容詞",
  5: "副詞",
  6: "接続詞",
  7: "感動詞",
  8: "助動詞",
  9: "その他"
};

export const CONJ_MAP = {
  1: "未然形",
  2: "連用形",
  3: "終止形",
  4: "連體形",
  5: "假定形",
  6: "命令形",
  7: "意向形",
  10: "て形",
  11: "た形",
  12: "ない形"
};

/**
 * Strategy C: Moving mapping definitions into Schema descriptions to reduce prompt noise.
 */
const schema = {
  type: Type.OBJECT,
  properties: {
    st: { 
      type: Type.STRING, 
      description: "Concise Traditional Chinese translation of the whole sentence." 
    },
    ts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          t: { type: Type.STRING, description: "Japanese token." },
          p: { 
            type: Type.INTEGER, 
            description: "POS code: 1:動詞, 2:名詞, 3:助詞, 4:形容詞, 5:副詞, 6:接続詞, 7:感動詞, 8:助動詞, 9:その他" 
          },
          jl: { 
            type: Type.INTEGER, 
            description: "JLPT: 0:None, 1:N1, 2:N2, 3:N3, 4:N4, 5:N5" 
          },
          tr: { type: Type.STRING, description: "Short Trad. Chinese meaning." },
          r: { type: Type.STRING, description: "Hiragana reading for kanji, else empty." },
          ex: { type: Type.STRING, description: "BRIEF Trad. Chinese grammatical role." },
          c: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              cf: { 
                type: Type.INTEGER, 
                description: "Current form code from CONJ mapping." 
              },
              f: {
                type: Type.OBJECT,
                description: "Mapping of CONJ code (string) to word. Codes: 1:未然, 2:連用, 3:終止, 4:連體, 5:假定, 6:命令, 7:意向, 10:て, 11:た, 12:ない"
              },
            },
            required: ["cf", "f"],
          },
        },
        required: ["t", "p", "jl", "r", "tr", "ex"],
      },
    },
  },
  required: ["st", "ts"],
};

export async function translateToJapanese(text, apiKey, modelName = "gemini-2.5-flash") {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `你是一位專業的日語教科書編者。請將以下意思轉化為受過良好教育的日本人會說的、禮貌正式的日文句子（です/ます調）。
1. 意譯優先，自然省略人稱。
2. 嚴禁直譯漢字。
3. 只能輸出日文句子。
Input Meaning: 【${text}】
Output:`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { temperature: 0.3 },
  });
  const rawText = response.text || "";
  return rawText.trim().replace(/^【.*】/, '').replace(/^Output:/i, '').replace(/^「|」$/g, '').trim();
}

function fixTruncatedJson(jsonString) {
  let res = jsonString.trim();
  res = res.replace(/,\s*$/, "").replace(/:\s*$/, "").replace(/,\s*"[^"]*"\s*$/, "");
  let stack = [];
  let inString = false;
  for (let i = 0; i < res.length; i++) {
    let char = res[i];
    if (char === '"' && res[i-1] !== '\\') inString = !inString;
    else if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') stack.pop();
    }
  }
  if (inString) res += '"';
  while (stack.length > 0) res += stack.pop();
  return res;
}

export async function analyzeSentence(sentence, apiKey, modelName = "gemini-2.5-flash") {
  console.log('Analyzing Japanese Sentence:', sentence);
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  // Clean prompt focusing only on the linguistic analysis task.
  const prompt = `Analyze this Japanese sentence linguistically.
- All text ('st', 'tr', 'ex') MUST be in Traditional Chinese (zh-tw).
- Provide tokens, POS codes, JLPT levels, and conjugations as defined in the schema.
- Keep explanations ('ex') very brief (< 15 chars).

Japanese sentence: ${sentence}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });

  const text = response.text || "";
  console.log('Raw JSON Response from Gemini:', text);

  try {
    return JSON.parse(text.trim());
  } catch (e) {
    try {
      const start = text.indexOf('{');
      if (start !== -1) {
        const fixed = fixTruncatedJson(text.substring(start));
        return JSON.parse(fixed);
      }
    } catch (e2) {}
    throw new Error(`分析失敗：模型輸出異常，請稍後再試。`);
  }
}
