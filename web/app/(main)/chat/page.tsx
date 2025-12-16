'use client';

import { useAuth } from '../../contexts/AuthContext';
import ChatView from '../../components/ChatView';

export default function ChatPage() {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>AI Calendar Assistant</h2>

      {/* Show login prompt if not authenticated */}
      {!isLoggedIn && (
        <div style={{
          padding: '2rem',
          backgroundColor: '#fffbeb',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <p>Please login with Google to chat with your AI calendar assistant.</p>
        </div>
      )}

      <ChatView isLoggedIn={isLoggedIn} />
    </div>
  );
}
