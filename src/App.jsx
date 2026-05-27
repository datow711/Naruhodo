import React, { useState, useEffect } from 'react';
import { analyzeSentence, translateToJapanese, POS_MAP, CONJ_MAP } from './gemini';
import './index.css';

function SettingsModal({ isOpen, onClose, apiKey, setApiKey, modelName, setModelName }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="card-cream modal-content">
        <h3 className="heading-3" style={{ marginBottom: '16px' }}>API Settings</h3>

        <div style={{ marginBottom: '16px' }}>
          <label className="caption" style={{ display: 'block', marginBottom: '8px' }}>Gemini API Key</label>
          <input
            type="password"
            className="text-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label className="caption" style={{ display: 'block', marginBottom: '8px' }}>Model</label>
          <select
            className="text-input"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            style={{ appearance: 'auto' }}
          >
            <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Fast & Free)</option>
            <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
            <option value="gemini-3.5-flash">gemini-3.5-flash (Latest)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="button-dark" onClick={onClose}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shortened JSON keys mapping:
 * st: sentenceTranslation, ts: tokens, t: token, p: pos, jl: jlptLevel, r: reading, tr: translation, ex: explanation, c: conjugations, cf: currentForm, f: forms
 */

function TokenTooltip({ tokenInfo }) {
  // JLPT Numeric Map: 0:None, 1:N1, 2:N2, 3:N3, 4:N4, 5:N5
  const jlptMap = { 0: "None", 1: "N1", 2: "N2", 3: "N3", 4: "N4", 5: "N5" };
  const jlptLabel = jlptMap[tokenInfo.jl] || "None";
  const isHighLevel = [1, 2, 3].includes(tokenInfo.jl);

  const getPosColor = (posCode) => {
    const map = {
      1: "#fa520f", // 動詞
      3: "#1a8b9d", // 助詞
      4: "#7352b3", // 形容詞
      2: "#6a6a6a", // 名詞
      5: "#d9487c", // 副詞
      8: "#fa520f", // 助動詞
      6: "#d9487c", // 接続詞
      7: "#8a8a8a", // 感動詞
      9: "#8a8a8a"  // その他
    };
    return map[posCode] || "#8a8a8a";
  };

  const posName = POS_MAP[tokenInfo.p] || "その他";
  const tokenColor = getPosColor(tokenInfo.p);

  return (
    <div className="tooltip card-feature" style={{ 
      position: 'absolute', 
      top: '100%', 
      left: '0', 
      marginTop: '8px',
      zIndex: 50,
      width: 'max-content',
      minWidth: '200px',
      maxWidth: '300px',
      padding: '16px',
      lineHeight: '1.5'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span className="heading-4" style={{ color: tokenColor }}>{tokenInfo.t}</span>
        <span className="caption" style={{ color: 'var(--color-steel)' }}>{posName}</span>
        {tokenInfo.jl > 0 && (
          <span className={isHighLevel ? "badge-orange" : "badge-dark"} style={isHighLevel ? {} : { backgroundColor: 'var(--color-stone)' }}>
            {jlptLabel}
          </span>
        )}
      </div>

      <div className="caption-bold" style={{ color: 'var(--color-primary-deep)', marginBottom: '4px' }}>
        {tokenInfo.tr}
      </div>

      <p style={{ marginBottom: tokenInfo.c ? '16px' : '0', lineHeight: '1.5' }}>{tokenInfo.ex}</p>

      {tokenInfo.c && tokenInfo.c.f && (
        <div style={{ borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '12px' }}>
          <p className="caption-bold" style={{ marginBottom: '8px' }}>
            變化型參考
            <span style={{ color: 'var(--color-stone)', fontWeight: 400, marginLeft: '6px' }}>
              (現在: <strong style={{ color: 'var(--color-primary)' }}>{CONJ_MAP[tokenInfo.c.cf]}</strong>)
            </span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '14px' }}>
            {/* Strategy 3: Accessing compressed 'f' object where keys are conjugation codes */}
            {Object.entries(tokenInfo.c.f).map(([conjCode, word], idx) => {
              const codeNum = parseInt(conjCode);
              const isCurrent = codeNum === tokenInfo.c.cf;
              return (
                <React.Fragment key={idx}>
                  <div style={{ color: 'var(--color-steel)' }}>{CONJ_MAP[codeNum]}</div>
                  <div>
                    <span style={{
                      color: isCurrent ? 'var(--color-primary)' : 'var(--color-slate)',
                      fontWeight: isCurrent ? '600' : 'normal',
                      backgroundColor: isCurrent ? 'var(--color-cream-deeper)' : 'transparent',
                      padding: '0 4px',
                      borderRadius: '4px'
                    }}>
                      {word}
                    </span>
                    {isCurrent && (
                      <span style={{ marginLeft: '8px', color: 'var(--color-primary)', fontSize: '12px' }}>← 現在使用</span>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TokenViewer({ tokens }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getPosColor = (posCode) => {
    const map = {
      1: "#fa520f", // 動詞
      3: "#1a8b9d", // 助詞
      4: "#7352b3", // 形容詞
      2: "#6a6a6a", // 名詞
      5: "#d9487c", // 副詞
      8: "#fa520f", // 助動詞
      6: "#d9487c", // 接続詞
      7: "#8a8a8a", // 感動詞
      9: "#8a8a8a"  // その他
    };
    return map[posCode] || "#8a8a8a";
  };

  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="card-cream" style={{ 
      marginTop: '24px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '8px 16px', 
      padding: '24px 16px', // 減少內邊距以適配手機
      lineHeight: '3.5'
    }}>
      {tokens.map((token, index) => {
        const tokenColor = getPosColor(token.p);
        // 只有包含漢字才顯示注音
        const hasKanji = /[\u4e00-\u9faf]/.test(token.t);
        const shouldShowReading = token.r && hasKanji;

        return (
          <div 
            key={index} 
            style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span 
              className="heading-2"
              style={{ 
                color: tokenColor,
                borderBottom: hoveredIndex === index ? `2px solid ${tokenColor}` : '2px solid transparent',
                transition: 'all 0.2s ease',
                paddingBottom: '4px',
                backgroundColor: hoveredIndex === index ? 'var(--color-canvas)' : 'transparent',
                borderRadius: '4px',
                verticalAlign: 'baseline',
                fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' // 響應式字體大小
              }}
            >
              {shouldShowReading ? (
                <ruby style={{ display: 'inline-flex', flexDirection: 'column-reverse', alignItems: 'center', verticalAlign: 'baseline' }}>
                  {token.t}
                  <rt style={{ 
                    fontSize: '0.45em', 
                    lineHeight: '1', 
                    marginBottom: '10px',
                    display: 'block',
                    color: 'var(--color-stone)'
                  }}>{token.r}</rt>
                </ruby>
              ) : (
                token.t
              )}
            </span>

            {hoveredIndex === index && <TokenTooltip tokenInfo={token} />}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [modelName, setModelName] = useState(() => {
    const saved = localStorage.getItem('gemini_model_name');
    if (saved && (saved.includes('1.5') || saved.includes('2.0'))) return 'gemini-2.5-flash';
    return saved || 'gemini-2.5-flash';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(!apiKey);

  const [sentence, setSentence] = useState('');
  const [originalSentence, setOriginalSentence] = useState('');
  const [tokens, setTokens] = useState([]);
  const [sentenceTranslation, setSentenceTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('gemini_model_name', modelName);
  }, [modelName]);

  const isJapanese = (text) => {
    const kanaRegex = /[\u3040-\u309f\u30a0-\u30ff\uff65-\uff9f]/;
    return kanaRegex.test(text);
  };

  const handleAnalyze = async () => {
    if (!sentence.trim()) return;
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let textToAnalyze = sentence;
      if (!isJapanese(sentence)) {
        textToAnalyze = await translateToJapanese(sentence, apiKey, modelName);
        console.log('Original Input:', sentence);
        console.log('Translated Output:', textToAnalyze);
        setOriginalSentence(sentence);
      } else {
        setOriginalSentence('');
      }

      const result = await analyzeSentence(textToAnalyze, apiKey, modelName);
      setTokens(result.ts || []);
      setSentenceTranslation(result.st || '');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="container" style={{ 
        padding: '32px 20px', 
        display: 'grid', 
        gridTemplateColumns: '100px 1fr 100px', // 左、中、右三欄，確保中間絕對置中
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* 左側佔位符，平衡佈局 */}
        <div /> 

        <div style={{ textAlign: 'center' }}>
          <h1 className="heading-3" style={{ margin: 0 }}>Japanese Grammar</h1>
          <p className="caption" style={{ color: 'var(--color-stone)', margin: 0 }}>
            Understand grammar with syntax-highlighting.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="button-dark" 
            onClick={() => setIsSettingsOpen(true)} 
            style={{ 
              padding: '8px 12px',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      <main className="container" style={{ flex: 1, paddingBottom: '24px' }}>
        <div className="card-feature" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <input
            type="text"
            className="text-input"
            placeholder="Enter a Japanese sentence or any other language..."
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            className="button-primary"
            onClick={handleAnalyze}
            disabled={isLoading || !sentence.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '16px', color: 'var(--color-primary-deep)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {(originalSentence || sentenceTranslation) && !isLoading && !error && (
          <div style={{ marginTop: '16px', textAlign: 'center', padding: '10px 16px', backgroundColor: 'var(--color-surface-cream-soft)', borderRadius: 'var(--rounded-md)' }}>
            {originalSentence && (
              <p style={{ font: 'var(--font-body-md)', color: 'var(--color-stone)', marginBottom: '4px' }}>
                原文: {originalSentence}
              </p>
            )}
            <p style={{ font: 'var(--font-body-md)', color: 'var(--color-ink)' }}>{sentenceTranslation}</p>
          </div>
        )}

        <TokenViewer tokens={tokens} />
      </main>

      <footer className="sunset-stripe-band" style={{ flexShrink: 0 }} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        modelName={modelName}
        setModelName={setModelName}
      />
    </div>
  );
}

export default App;
