import React from 'react';
import { GitBranch, Database, BrainCircuit, MessageSquare } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout" style={{ flex: 1, padding: '2rem 1rem' }}>
      {/* Detailed Description Panel */}
      <div className="auth-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            marginBottom: '1.5rem', 
            letterSpacing: '-0.03em', 
            background: 'linear-gradient(135deg, #1d1d1f 0%, #434345 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
        }}>
          Understand Any Codebase.
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          The RAG Codebase Explainer is a powerful AI-driven platform that completely automates the process of understanding complex software repositories. It utilizes Retrieval-Augmented Generation to enable interactive exploration of architectures and logic.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <GitBranch size={24} color="var(--accent-color)" />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>1. Repository Ingestion</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Provide any GitHub repository URL. The backend automatically clones the code and intelligently chunks the files based on language semantics.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <BrainCircuit size={24} color="var(--accent-color)" />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>2. AI Vector Embeddings</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                A dedicated worker transforms the code chunks into high-dimensional vector embeddings, capturing the deep mathematical relationships within the logic.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Database size={24} color="var(--accent-color)" />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>3. Vector Storage</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Embeddings are persisted in a high-performance Qdrant vector database, enabling ultra-fast similarity searches across millions of lines of code.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <MessageSquare size={24} color="var(--accent-color)" />
            </div>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>4. Interactive Exploration</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The codebase becomes available for real-time interaction. The system retrieves relevant code chunks and generates precise, context-aware explanations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '420px' }}>
        {children}
      </div>
    </div>
  );
}
