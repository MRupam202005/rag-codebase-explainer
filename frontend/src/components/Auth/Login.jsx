import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiClient.post('/api/auth/login', { email, password });
            const responseData = res.data;
            
            login(responseData.data.user, responseData.data.accessToken);
            toast.success("Welcome back!");
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to login');
        }
    };

    return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--accent-color)', padding: '1rem', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <Code2 size={32} color="white" />
                    </div>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Welcome Back</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Sign in to continue to your dashboard</p>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" style={{ marginTop: '1rem', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
                        Sign In <ArrowRight size={18} />
                    </button>
                </form>
                <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
                </p>
                
                {/* Brief Documentation / Explanation */}
                <div style={{ 
                    background: 'rgba(255,255,255,0.4)', 
                    padding: '1.25rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    textAlign: 'left',
                    marginTop: '2rem' 
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>What is this?</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0' }}>
                        The <strong>RAG Codebase Explainer</strong> acts as your intelligent pair-programmer. Submit a GitHub URL, and our system will ingest, chunk, and embed the code using advanced language models. You can then chat with the codebase in real-time to understand its architecture and logic.
                    </p>
                </div>
            </div>
        </div>
    );
}
