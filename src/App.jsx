import React, { useState, useEffect } from 'react';
import { analyzeSentence } from './gemini';
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

function TokenTooltip({ tokenInfo }) {
  const isHighLevel = ['N3', 'N2', 'N1'].includes(tokenInfo.jlptLevel);

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
      padding: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span className="heading-4" style={{ color: tokenInfo.color }}>{tokenInfo.token}</span>
        <span className="caption" style={{ color: 'var(--color-steel)' }}>{tokenInfo.pos}</span>
        {tokenInfo.jlptLevel && tokenInfo.jlptLevel !== 'None' && (
          <span className={isHighLevel ? "badge-orange" : "badge-dark"} style={isHighLevel ? {} : { backgroundColor: 'var(--color-stone)' }}>
            {tokenInfo.jlptLevel}
          </span>
        )}
      </div>
      
      <div className="caption-bold" style={{ color: 'var(--color-primary-deep)', marginBottom: '4px' }}>
        {tokenInfo.translation}
      </div>
      <p style={{ marginBottom: tokenInfo.conjugations ? '16px' : '0' }}>{tokenInfo.explanation}</p>

      {tokenInfo.conjugations && (
        <div style={{ borderTop: '1px solid var(--color-hairline-soft)', paddingTop: '12px' }}>
          <p className="caption-bold" style={{ marginBottom: '8px' }}>
            變化型參考
            <span style={{ color: 'var(--color-stone)', fontWeight: 400, marginLeft: '6px' }}>
              (現在: <strong style={{ color: 'var(--color-primary)' }}>{tokenInfo.conjugations.currentForm}</strong>)
            </span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '14px' }}>
            {(tokenInfo.conjugations.forms || []).map(({ name, word }) => {
              const isCurrent = name === tokenInfo.conjugations.currentForm;
              return (
                <React.Fragment key={name}>
                  <div style={{ color: 'var(--color-steel)' }}>{name}</div>
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

  if (!tokens || tokens.length === 0) return null;

  return (
    <div className="card-cream" style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '32px' }}>
      {tokens.map((token, index) => (
        <div 
          key={index} 
          style={{ position: 'relative', cursor: 'pointer' }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span 
            className="heading-2"
            style={{ 
              color: token.color,
              borderBottom: hoveredIndex === index ? `2px solid ${token.color}` : '2px solid transparent',
              transition: 'all 0.2s ease',
              paddingBottom: '2px',
              backgroundColor: hoveredIndex === index ? 'var(--color-canvas)' : 'transparent',
              borderRadius: '4px'
            }}
          >
            {token.reading ? (
              <ruby>
                {token.token}
                <rt>{token.reading}</rt>
              </ruby>
            ) : (
              token.token
            )}
          </span>
          
          {hoveredIndex === index && <TokenTooltip tokenInfo={token} />}
        </div>
      ))}
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
    if (!sentence.trim()) return;
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSentence(sentence, apiKey, modelName);
      setTokens(result.tokens || []);
      setSentenceTranslation(result.sentenceTranslation || '');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="button-dark" onClick={() => setIsSettingsOpen(true)}>
          ⚙️ Settings
        </button>
      </header>

      <main className="container" style={{ flex: 1, paddingBottom: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="heading-3" style={{ marginBottom: '6px' }}>Japanese Grammar Analyzer</h1>
          <p className="caption" style={{ color: 'var(--color-stone)' }}>
            Understand Japanese grammar with syntax-highlighted tokenization.
          </p>
        </div>

        <div className="card-feature" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input 
            type="text" 
            className="text-input" 
            placeholder="Enter a Japanese sentence (e.g., 私は林檎を食べます)" 
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

        {sentenceTranslation && !isLoading && !error && (
          <div style={{ marginTop: '16px', textAlign: 'center', padding: '10px 16px', backgroundColor: 'var(--color-surface-cream-soft)', borderRadius: 'var(--rounded-md)' }}>
            <p style={{ font: 'var(--font-body-md)', color: 'var(--color-slate)' }}>{sentenceTranslation}</p>
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
