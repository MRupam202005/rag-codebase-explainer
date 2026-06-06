import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import LandingHero from './components/LandingHero';
import PipelineLoader from './components/PipelineLoader';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const startIngestion = async (url) => {
    try {
      const res = await fetch('http://localhost:5000/api/ingest-repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: url })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Navigate to loading screen and pass the original URL via state
      navigate(`/loading/${data.jobId}`, { state: { githubUrl: url } });
    } catch (err) {
      alert(`Failed to start ingestion: ${err.message}`);
    }
  };

  const handleIngestionComplete = (url) => {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    navigate(`/chat/${cleanUrl}`);
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
        
        {location.pathname !== '/' && (
          <button onClick={() => {
            navigate('/');
          }} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
            Start Over
          </button>
        )}
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
        <Routes>
          <Route path="/" element={<LandingHero onStartIngestion={startIngestion} />} />
          
          <Route path="/loading/:id" element={
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
               <PipelineLoaderWrapper onComplete={handleIngestionComplete} />
            </div>
          } />
          
          <Route path="/chat/*" element={
            <>
              <Sidebar />
              <div style={{ flex: 1 }}>
                <ChatInterfaceWrapper />
              </div>
            </>
          } />
        </Routes>
      </main>
    </>
  );
}

// Wrapper to pass route params to PipelineLoader
import { useParams } from 'react-router-dom';
function PipelineLoaderWrapper({ onComplete }) {
  const { id } = useParams();
  const location = useLocation();
  const githubUrl = location.state?.githubUrl;
  
  if (!githubUrl) return <Navigate to="/" />;
  
  return <PipelineLoader jobId={id} onComplete={() => onComplete(githubUrl)} />;
}

// Wrapper to pass the githubUrl to ChatInterface
function ChatInterfaceWrapper() {
  const { '*': repoPath } = useParams();
  
  if (!repoPath) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Select a repository from the sidebar.</div>;
  
  const githubUrl = `https://${repoPath}`;
  
  // We add a key to force re-mount when the URL changes
  return <ChatInterface key={githubUrl} githubUrl={githubUrl} />;
}

export default App;
