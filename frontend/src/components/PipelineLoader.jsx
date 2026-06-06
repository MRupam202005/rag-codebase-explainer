import React, { useEffect, useState, useContext } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function PipelineLoader({ jobId, onComplete }) {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  // We map backend states to our UI stepper
  const steps = [
    { id: 'processing', label: 'Queued / Cloning Repository' },
    { id: 'chunking', label: 'Semantic Chunking & AST Parsing' },
    { id: 'storing', label: 'Generating Vectors & Qdrant Storage' },
    { id: 'completed', label: 'Ready for Chat' }
  ];

  useEffect(() => {
    let interval;
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/job/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const responseData = await res.json();

        if (responseData.data && responseData.data.status) {
          const jobData = responseData.data;
          setStatus(jobData.status);
          
          if (jobData.status === 'completed') {
            clearInterval(interval);
            setTimeout(() => onComplete(jobData.url), 1000); // 1 sec delay to show the final checkmark
          } else if (jobData.status === 'failed') {
            clearInterval(interval);
            setError(jobData.error || 'Job failed during processing');
          }
        }
      } catch (err) {
        console.error("Error polling status:", err);
      }
    };

    // Poll every 1.5 seconds
    interval = setInterval(checkStatus, 1500);
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  // Determine which step we are currently on (0 to 3)
  const currentStepIndex = steps.findIndex(s => s.id === status) === -1 
    ? 0 // default to first step if unknown
    : steps.findIndex(s => s.id === status);

  if (error) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <XCircle size={48} color="red" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ color: 'red', marginBottom: '0.5rem' }}>Processing Failed</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '2rem' }}>Start Over</button>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '500px', margin: '4rem auto 0 auto' }}>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 600 }}>Processing Repository</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || status === 'completed';
          const isCurrent = index === currentStepIndex && status !== 'completed';
          
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: isCompleted || isCurrent ? 1 : 0.4 }}>
              <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isCompleted ? (
                  <CheckCircle2 size={24} color="var(--success-color)" />
                ) : isCurrent ? (
                  <Loader2 size={24} color="var(--accent-color)" className="spinner" />
                ) : (
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--border-color)' }} />
                )}
              </div>
              <span style={{ 
                fontWeight: isCurrent ? 600 : 400,
                color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
