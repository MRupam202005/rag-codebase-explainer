import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('Verifying your email...');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/auth/verify/${token}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Verification failed');
                }

                setStatus('Email verified successfully! Logging you in...');
                toast.success('Account verified!');
                
                // Log them in automatically
                login(data.user, data.token);
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    navigate('/');
                }, 1500);

            } catch (err) {
                setStatus(`Error: ${err.message}`);
                toast.error(err.message);
            }
        };

        if (token) {
            verify();
        }
    }, [token, login, navigate]);

    return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 600 }}>Email Verification</h2>
                <p style={{ marginBottom: '1.5rem', color: status.includes('Error') ? 'red' : 'var(--text-secondary)' }}>
                    {status}
                </p>
                {status.includes('Error') && (
                    <Link to="/login" style={{ color: 'var(--accent-color)' }}>Return to Login</Link>
                )}
            </div>
        </div>
    );
}
