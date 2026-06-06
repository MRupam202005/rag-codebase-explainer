import React, { useState } from 'react';
import LandingHero from './components/LandingHero';
import PipelineLoader from './components/PipelineLoader';
import ChatInterface from './components/ChatInterface';

function App() {
  const [stage, setStage] = useState('landing'); // 'landing', 'loading', 'chat'
  const [jobId, setJobId] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');

  const startIngestion = async (url) => {
    try {
      const res = await fetch('http://localhost:5000/api/ingest-repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: url })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGithubUrl(url);
      setJobId(data.jobId);
      setStage('loading');
    } catch (err) {
      alert(`Failed to start ingestion: ${err.message}`);
    }
  };

  const handleIngestionComplete = (url) => {
    setStage('chat');
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            RAG
          </div>
          <span style={{ fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Codebase Explainer</span>
        </div>
        
        {stage !== 'landing' && (
          <button onClick={() => setStage('landing')} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem 1rem', border: '1px solid var(--border-color)' }}>
            Start Over
          </button>
        )}
      </nav>

      {/* Main Content Area */}
      <main>
        {stage === 'landing' && <LandingHero onStartIngestion={startIngestion} />}
        {stage === 'loading' && <PipelineLoader jobId={jobId} onComplete={handleIngestionComplete} />}
        {stage === 'chat' && <ChatInterface githubUrl={githubUrl} />}
      </main>
    </>
  );
}

export default App;
