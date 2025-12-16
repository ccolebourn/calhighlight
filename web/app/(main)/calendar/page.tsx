'use client';

import { useAuth } from '../../contexts/AuthContext';
import CalendarView from '../../components/CalendarView';

export default function CalendarPage() {
  const { isLoggedIn } = useAuth();

  return (
    <div>
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
          <h2>Welcome to Calendar Highlight</h2>
          <p>Please login with Google to access your calendar.</p>
        </div>
      )}

      <CalendarView isLoggedIn={isLoggedIn} />
    </div>
  );
}
