import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';

export default function ChatInterface({ githubUrl }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I have successfully analyzed the codebase at **${githubUrl}**.\n\nWhat would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl, question: userMessage })
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '80vh', 
      marginTop: '1rem',
      padding: '0',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Codebase Assistant</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          {githubUrl}
        </p>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ 
              background: msg.role === 'assistant' ? 'var(--accent-color)' : '#f3f4f6', 
              color: msg.role === 'assistant' ? 'white' : '#111',
              padding: '0.6rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
            </div>
            
            <div style={{ 
              background: msg.role === 'assistant' ? 'transparent' : '#f3f4f6',
              padding: msg.role === 'assistant' ? '0' : '1rem',
              borderRadius: '12px',
              borderTopLeftRadius: msg.role === 'user' ? '0' : '12px',
              maxWidth: '85%',
              lineHeight: 1.6
            }}>
              {/* Note: In a production app, we would use react-markdown here to render code blocks properly */}
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
             <div style={{ background: 'var(--accent-color)', color: 'white', padding: '0.6rem', borderRadius: '8px' }}>
              <Bot size={20} />
            </div>
            <Loader2 className="spinner" size={24} color="var(--text-secondary)" style={{ marginTop: '0.4rem' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question about the code..."
            disabled={isLoading}
            style={{ flex: 1, padding: '1rem', borderRadius: '12px' }}
          />
          <button type="submit" disabled={isLoading || !input.trim()} style={{ padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
