import React, { useState } from 'react';
import { GitBranch, Database, Server, ArrowRight } from 'lucide-react';

export default function LandingHero({ onStartIngestion }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onStartIngestion(url.trim());
    }
  };

  return (
    <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
        Talk to any Codebase.
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Paste a GitHub URL. We'll chunk it, embed it, and let you chat with it.
      </p>

      {/* Animated Architectural Flow Diagram */}
      <div className="glass-panel" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: '600px',
        margin: '0 auto 3rem auto',
        padding: '2rem 3rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div className="glowing-node" style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '50%' }}>
            <GitBranch size={32} color="#111" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>GitHub</span>
        </div>

        <svg width="100" height="24" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="animated-line" d="M0 12H100" stroke="#000" strokeWidth="2" strokeDasharray="4 6" opacity="0.3"/>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div className="glowing-node" style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '50%' }}>
            <Server size={32} color="#111" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Node.js</span>
        </div>

        <svg width="100" height="24" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="animated-line" d="M0 12H100" stroke="#000" strokeWidth="2" strokeDasharray="4 6" opacity="0.3"/>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div className="glowing-node" style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '50%' }}>
            <Database size={32} color="#111" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Qdrant DB</span>
        </div>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto 2rem auto', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          placeholder="https://github.com/expressjs/express" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          Let's Try <ArrowRight size={16} />
        </button>
      </form>

      {/* Brief Documentation / Explanation */}
      <div style={{ 
          background: 'rgba(255,255,255,0.4)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          textAlign: 'left',
          marginTop: '3rem' 
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>How It Works</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          <strong>RAG Codebase Explainer</strong> acts as your intelligent pair-programmer. When you submit a GitHub repository:
        </p>
        <ul style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.5rem', marginBottom: '0' }}>
          <li>The backend automatically clones the repository and extracts the raw source code.</li>
          <li>Code files are split into semantic chunks and embedded using advanced language models.</li>
          <li>Embeddings are securely stored in a high-performance <strong>Qdrant Vector Database</strong>.</li>
          <li>You can then chat with the codebase in real-time, asking complex questions about architecture, logic, and dependencies.</li>
        </ul>
      </div>
    </div>
  );
}
