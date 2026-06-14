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
import apiClient from './config/apiClient';
import toast from 'react-hot-toast';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, loading, logout } = useContext(AuthContext);

  const startIngestion = async (url) => {
    try {
      const res = await apiClient.post('/api/ingest-repository', { githubUrl: url });
      
      const responseData = res.data;

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

    const [isHoveringUser, setIsHoveringUser] = useState(false);

    return (
    <>
      {/* Top Navigation Bar */}
      <nav className="glass-panel" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '2rem',
        padding: '1rem 1.5rem',
        borderRadius: '24px', // More rounded pill shape for navbar
        position: 'relative',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0071e3 0%, #4facfe 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)' }}>
            RAG
          </div>
          <span style={{ fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Codebase Explainer</span>
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
            <div 
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setIsHoveringUser(true)}
              onMouseLeave={() => setIsHoveringUser(false)}
            >
              {/* User Avatar Circle */}
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #0071e3 0%, #4facfe 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 113, 227, 0.25)',
                border: '2px solid white'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Dropdown Menu on Hover */}
              {isHoveringUser && (
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--panel-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  minWidth: '220px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '5px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>{user.email}</div>
                  </div>
                  
                  <button onClick={() => {
                    logout();
                    navigate('/login');
                  }} style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', 
                    padding: '0.6rem 1rem', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: 500,
                    width: '100%',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
          <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #0071e3 0%, #4facfe 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px', boxShadow: '0 2px 8px rgba(0, 113, 227, 0.2)' }}>
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
