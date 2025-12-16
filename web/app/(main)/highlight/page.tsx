'use client';

import { useAuth } from '../../contexts/AuthContext';

export default function HighlightPage() {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Calendar Highlights</h2>

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
          <p>Please login with Google to see your calendar highlights.</p>
        </div>
      )}

      {/* Placeholder content */}
      <div style={{
        padding: '3rem 2rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'center',
      }}>
        <h3 style={{ color: '#666', marginBottom: '1rem' }}>Coming Soon!</h3>
        <p style={{ color: '#888', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
          This feature will highlight important events from your calendar, detect conflicts, and provide intelligent summaries powered by AI.
        </p>

        {/* TODO: Future implementation notes
          * Add AI-powered event summarization
          * Highlight important/priority events
          * Detect scheduling conflicts
          * Show upcoming deadlines
          * Provide weekly/monthly insights
        */}
      </div>
    </div>
  );
}
