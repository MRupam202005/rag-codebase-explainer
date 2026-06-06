import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('Verifying your email...');
    const navigate = useNavigate();

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/verify/${token}`);
                const responseData = await res.json();

                if (!res.ok) {
                    throw new Error(responseData.message || 'Verification failed');
                }

                setStatus('Email verified successfully! Redirecting to login...');
                toast.success('Account verified!');
                
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login');
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
