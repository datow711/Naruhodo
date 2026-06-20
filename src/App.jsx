import React, { useState, useEffect } from 'react';
import {
  getConjLesson,
  getConjLevelGroup,
  getPosColor,
  getPosName,
} from './data/grammarMaps';
import { runSentenceAnalysis } from './services/analysisService';
import './index.css';
import logoTemp from '../logotemp.png';
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
  const hasConjugations = !!(tokenInfo.c && tokenInfo.c.f);
  const conjugationEntries = hasConjugations
    ? Object.entries(tokenInfo.c.f).map(([code, word]) => ({ code: Number(code), word }))
    : [];
  const n5Entries = conjugationEntries.filter(({ code }) => getConjLevelGroup(code) === 'N5');
  const n4Entries = conjugationEntries.filter(({ code }) => getConjLevelGroup(code) === 'N4');
  const extraEntries = conjugationEntries.filter(({ code }) => getConjLevelGroup(code) === '補充');
  const currentConjLesson = hasConjugations ? getConjLesson(tokenInfo.c.cf) : null;
  const currentGroup = hasConjugations ? getConjLevelGroup(tokenInfo.c.cf) : null;


  const posName = getPosName(tokenInfo.p);
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
          <span className={tokenInfo.jl <= 3 ? "badge-orange" : "badge-dark"} style={tokenInfo.jl <= 3 ? {} : { backgroundColor: 'var(--color-stone)' }}>
            {jlptLabel}
          </span>
        )}
      </div>

      <div className="caption-bold" style={{ color: 'var(--color-primary-deep)', marginBottom: '4px' }}>
        {tokenInfo.tr}
      </div>

      <p style={{ marginBottom: hasConjugations ? '16px' : '0', lineHeight: '1.5' }}>{tokenInfo.ex}</p>

      {hasConjugations && (
        <div style={{ borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '12px' }}>
          <p className="caption-bold" style={{ marginBottom: '8px' }}>
            N5 / N4 活用解釋
            <span style={{ color: 'var(--color-stone)', fontWeight: 400, marginLeft: '6px' }}>
              （目前：<strong style={{ color: 'var(--color-primary)' }}>{currentConjLesson.title}</strong>，{currentGroup}）
            </span>
          </p>
          <p className="caption" style={{ color: 'var(--color-steel)', marginBottom: '12px' }}>
            先記 N5 基礎活用，再把 N4 的條件與命令看進去。其餘型態保留為補充參考。
          </p>

          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            {n5Entries.length > 0 && (
              <div>
                <div className="caption-bold" style={{ marginBottom: '6px', color: 'var(--color-primary)' }}>N5 基礎活用</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px' }}>
                  {n5Entries.map(({ code, word }) => {
                    const lesson = getConjLesson(code);
                    const isCurrent = code === tokenInfo.c.cf;
                    return (
                      <React.Fragment key={code}>
                        <div style={{ color: 'var(--color-steel)' }}>{lesson.title}</div>
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
                          <div className="caption" style={{ color: 'var(--color-slate)', marginTop: '2px' }}>
                            {lesson.summary}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {n4Entries.length > 0 && (
              <div>
                <div className="caption-bold" style={{ marginBottom: '6px', color: 'var(--color-primary-deep)' }}>N4 延伸活用</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px' }}>
                  {n4Entries.map(({ code, word }) => {
                    const lesson = getConjLesson(code);
                    const isCurrent = code === tokenInfo.c.cf;
                    return (
                      <React.Fragment key={code}>
                        <div style={{ color: 'var(--color-steel)' }}>{lesson.title}</div>
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
                          <div className="caption" style={{ color: 'var(--color-slate)', marginTop: '2px' }}>
                            {lesson.summary}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {extraEntries.length > 0 && (
              <div>
                <div className="caption-bold" style={{ marginBottom: '6px', color: 'var(--color-steel)' }}>補充型態</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px' }}>
                  {extraEntries.map(({ code, word }) => {
                    const lesson = getConjLesson(code);
                    const isCurrent = code === tokenInfo.c.cf;
                    return (
                      <React.Fragment key={code}>
                        <div style={{ color: 'var(--color-steel)' }}>{lesson.title}</div>
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
                          <div className="caption" style={{ color: 'var(--color-slate)', marginTop: '2px' }}>
                            {lesson.focus}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TokenViewer({ tokens }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);


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

  const handleAnalyze = async () => {
    const input = sentence.trim();
    if (!input) return;
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setOriginalSentence('');
    setSentenceTranslation('');
    setTokens([]);

    try {
      const analysis = await runSentenceAnalysis({ sentence: input, apiKey, modelName });
      if (analysis.warnings.length > 0) {
        console.warn('Analysis result normalized with warnings:', analysis.warnings);
      }
      setOriginalSentence(analysis.originalSentence);
      setTokens(analysis.result.ts);
      setSentenceTranslation(analysis.result.st);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.userMessage || err.message || 'Analysis failed. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="container" style={{ 
        padding: '32px 20px', 
        display: 'grid', 
        gridTemplateColumns: '150px 1fr 150px', 
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* 左側 Logo 區域 */}
        <div className="header-logo-box" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logoTemp} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div> 

        <div className="header-title-box" style={{ textAlign: 'center' }}>
          <h1 className="heading-3" style={{ margin: 0 }}>Japanese Grammar</h1>
          <p className="caption" style={{ color: 'var(--color-stone)', margin: 0 }}>
            Understand grammar with syntax-highlighting.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="button-dark mobile-settings-btn" 
            onClick={() => setIsSettingsOpen(true)} 
            style={{ 
              padding: '8px 12px',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>⚙️ Settings</span>
            <em className="mobile-only-icon" style={{ display: 'none' }}>⚙️</em> 
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
