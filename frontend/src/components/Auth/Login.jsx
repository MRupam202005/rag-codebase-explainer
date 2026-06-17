import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';
import AuthLayout from './AuthLayout';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showResend, setShowResend] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowResend(false);
        try {
            const res = await apiClient.post('/api/auth/login', { email, password });
            const responseData = res.data;
            
            login(responseData.data.user, responseData.data.accessToken);
            toast.success("Welcome back!");
            navigate('/');
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to login';
            toast.error(errorMessage);
            if (errorMessage.toLowerCase().includes('not verified')) {
                setShowResend(true);
            }
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast.error("Please enter your email address first");
            return;
        }
        setResendLoading(true);
        try {
            await apiClient.post('/api/auth/resend-verification', { email });
            toast.success("Verification email resent successfully. Please check your inbox.");
            setShowResend(false);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to resend verification email');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <AuthLayout>
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
                    {showResend && (
                        <button 
                            type="button" 
                            onClick={handleResend}
                            disabled={resendLoading}
                            style={{ 
                                padding: '0.85rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.5rem', 
                                fontSize: '0.95rem', 
                                fontWeight: 600,
                                backgroundColor: 'transparent',
                                border: '1px solid var(--accent-color)',
                                color: 'var(--text-primary)',
                                borderRadius: '12px',
                                cursor: resendLoading ? 'not-allowed' : 'pointer',
                                opacity: resendLoading ? 0.7 : 1
                            }}>
                            {resendLoading ? "Sending..." : "Resend Verification Email"}
                        </button>
                    )}
                </form>
                <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
