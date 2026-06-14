import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GitBranch, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '../config/apiClient';

export default function Sidebar() {
  const [repositories, setRepositories] = useState([]);
  const navigate = useNavigate();
  const { '*': repoPath } = useParams();
  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await apiClient.get('/api/repositories');
        const data = res.data;
        
        setRepositories(data.data?.repositories || []);
      } catch (err) {
        console.error("Failed to load recent repositories", err);
        toast.error("Failed to load repositories");
      }
    };
    if (token) fetchRepos();
  }, [token, logout]);

  return (
    <div className="glass-panel sidebar-panel" style={{ 
      width: '100%', 
      minWidth: '280px',
      maxWidth: '400px',
      flex: '0 0 33%', // Roughly 1/3 of the screen
      height: 'calc(100vh - 140px)', // Fixed height based on viewport
      marginTop: '1rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', paddingLeft: '0.5rem' }}>
        <Clock size={16} />
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Repositories</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {repositories.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No repositories analyzed yet.</p>
        ) : (
          repositories.map(repo => {
            const isSelected = repoPath && repo.url.includes(repoPath);
            return (
              <div 
                key={repo._id}
                onClick={() => {
                  // Navigate to the chat page with the url without https://
                  const cleanUrl = repo.url.replace(/^https?:\/\//, '');
                  navigate(`/chat/${cleanUrl}`);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: isSelected ? 'var(--accent-color)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                  boxShadow: isSelected ? '0 4px 12px rgba(0, 113, 227, 0.25)' : 'none',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                <GitBranch size={16} style={{ color: isSelected ? 'white' : 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {repo.url.replace(/^https?:\/\/(github\.com\/)?/, '')}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
