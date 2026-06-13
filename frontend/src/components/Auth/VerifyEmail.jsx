import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../config/apiClient';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('Verifying your email...');
    const navigate = useNavigate();

    const hasVerified = useRef(false);

    useEffect(() => {
        const verify = async () => {
            if (hasVerified.current) return;
            hasVerified.current = true;
            
            try {
                const res = await apiClient.get(`/api/auth/verify/${token}`);

                setStatus('Email verified successfully! Redirecting to login...');
                toast.success('Account verified!');
                
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 1500);

            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message || 'Verification failed';
                setStatus(`Error: ${errorMessage}`);
                toast.error(errorMessage);
            }
        };

        if (token) {
            verify();
        }
    }, [token, navigate]);

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
