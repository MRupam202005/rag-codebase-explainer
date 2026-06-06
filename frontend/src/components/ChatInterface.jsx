import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ChatInterface({ githubUrl }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I have successfully analyzed the codebase at **${githubUrl}**.\n\nWhat would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { token, logout } = useContext(AuthContext);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/history?githubUrl=${encodeURIComponent(githubUrl)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (res.status === 401) {
            toast.error("Session expired.");
            logout();
            return;
        }

        if (data.data?.history && data.data.history.length > 0) {
          setMessages(data.data.history);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
        toast.error("Failed to load chat history");
      }
    };
    if (token) fetchHistory();
  }, [githubUrl, token, logout]);

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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ githubUrl, question: userMessage })
      });

      if (!res.ok) throw new Error("Network response was not ok");

      // We immediately add an empty assistant message so we can stream into it
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      // Tap into the native browser stream!
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          setMessages(prev => {
            // Create a copy of the messages array
            const newMessages = [...prev];
            // Get the last message (which is our assistant message)
            const lastMessage = { ...newMessages[newMessages.length - 1] };
            // Append the new streamed text chunk
            lastMessage.content += chunk;
            // Replace it in the array
            newMessages[newMessages.length - 1] = lastMessage;
            return newMessages;
          });
        }
      }

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
      height: 'calc(100vh - 140px)', // Fixed height based on viewport
      flex: 1,
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
              lineHeight: 1.6,
              width: '100%',
              overflowX: 'auto'
            }}>
              {msg.role === 'user' ? (
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
              ) : (
                <div className="markdown-body" style={{ fontSize: '0.95rem' }}>
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            {...props}
                            children={String(children).replace(/\n$/, '')}
                            style={atomDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}
                          />
                        ) : (
                          <code {...props} className={className} style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.9em', color: 'var(--accent-color)' }}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
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
