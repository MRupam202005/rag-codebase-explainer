import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GitBranch, Clock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

export default function Sidebar() {
  const [repositories, setRepositories] = useState([]);
  const navigate = useNavigate();
  const { '*': repoPath } = useParams();
  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/repositories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (res.status === 401) {
            toast.error("Session expired. Please log in again.");
            logout();
            return;
        }
        
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
      width: '300px', 
      height: 'calc(100vh - 140px)', // Fixed height based on viewport
      flex: 1,
      marginTop: '1rem',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
        <Clock size={18} />
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Repositories</h3>
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
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.5)',
                  color: isSelected ? 'white' : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease',
                  border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                }}
              >
                <GitBranch size={16} />
                <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
