import React, { useState, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import LandingHero from './components/LandingHero';
import PipelineLoader from './components/PipelineLoader';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import { AuthContext } from './context/AuthContext';
import { API_BASE_URL } from './config/api';
import toast from 'react-hot-toast';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, loading, logout } = useContext(AuthContext);

  const startIngestion = async (url) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ingest-repository`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ githubUrl: url })
      });
      
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || 'Failed to start ingestion');

      // Navigate to loading screen and pass the original URL via state
      navigate(`/loading/${responseData.data.jobId}`, { state: { githubUrl: url } });
    } catch (err) {
      toast.error(`Failed to start ingestion: ${err.message}`);
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {location.pathname !== '/' && user && (
            <button onClick={() => {
              navigate('/');
            }} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
              Dashboard
            </button>
          )}
          
          {user && (
            <button onClick={() => {
              logout();
              navigate('/login');
            }} style={{ background: 'transparent', color: 'var(--text-primary)', padding: '0.5rem 1rem', border: '1px solid var(--accent-color)', borderRadius: '8px', cursor: 'pointer' }}>
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content" style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
        ) : (
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route path="/" element={
              user ? (
                <>
                  <Sidebar />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LandingHero onStartIngestion={startIngestion} />
                  </div>
                </>
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/loading/:id" element={
              user ? (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                   <PipelineLoaderWrapper onComplete={handleIngestionComplete} />
                </div>
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/chat/*" element={
              user ? (
                <>
                  <Sidebar />
                  <div style={{ flex: 1 }}>
                    <ChatInterfaceWrapper />
                  </div>
                </>
              ) : <Navigate to="/login" />
            } />
          </Routes>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        marginTop: 'auto', 
        padding: '2rem 0 1rem 0', 
        textAlign: 'center', 
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '20px', height: '20px', background: 'var(--accent-color)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>
            RAG
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Codebase Explainer</span>
        </div>
        <p>
          Crafted with passion by <strong>Rupam</strong>.
        </p>
      </footer>
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
