'use client';

import { useState } from 'react';
import { chatWithAI } from '../actions';

interface ChatViewProps {
  isLoggedIn: boolean;
}

export default function ChatView({ isLoggedIn }: ChatViewProps) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isLoggedIn) return;

    setLoading(true);
    setResponse('');

    try {
      const data = await chatWithAI(message);

      if (data.needsLogin) {
        alert('Your session has expired. Please login again.');
        return;
      }

      if (data.success && data.response) {
        setResponse(data.response);
      } else {
        setResponse(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', minHeight: '400px' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>AI Chat</h3>

      <form onSubmit={handleChat}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            id="message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your calendar..."
            disabled={loading || !isLoggedIn}
            style={{
              flex: 1,
              padding: '0.5rem',
              fontSize: '0.9rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !isLoggedIn || !message}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              backgroundColor: loading || !isLoggedIn || !message ? '#ccc' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !isLoggedIn || !message ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? 'Asking...' : 'Ask AI'}
          </button>
          {response && (
            <button
              type="button"
              onClick={() => setResponse('')}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {response && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: 'white',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap'
        }}>
          {response}
        </div>
      )}
    </div>
  );
}
