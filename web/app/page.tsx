'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@calhighlight/shared';
import { fetchCalendarAppointments, chatWithAI, getSessionStatus } from './actions';
import CalendarGrid from './components/CalendarGrid';

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fetchingCalendar, setFetchingCalendar] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const status = await getSessionStatus();
      setIsLoggedIn(status.isLoggedIn);
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setAppointments([]);
    setResponse('');
  };

  const handleFetchCalendar = async () => {
    if (!isLoggedIn) return;

    setFetchingCalendar(true);
    setAppointments([]);

    try {
      // Calculate end date (7 days from start)
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6); // 7 days total including start

      const endDateStr = end.toISOString().split('T')[0];

      const data = await fetchCalendarAppointments(startDate, endDateStr);

      if (data.needsLogin) {
        setIsLoggedIn(false);
        alert('Your session has expired. Please login again.');
        return;
      }

      if (data.success && data.appointments) {
        setAppointments(data.appointments);
      } else {
        alert(`Error: ${data.error || 'Failed to fetch appointments'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFetchingCalendar(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isLoggedIn) return;

    setLoading(true);
    setResponse('');

    try {
      const data = await chatWithAI(message);

      if (data.needsLogin) {
        setIsLoggedIn(false);
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

  if (checkingAuth) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Calendar Highlight</h1>

        {/* Login/Logout Button */}
        <div>
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                Logged in
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Login with Google
            </button>
          )}
        </div>
      </div>

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

      {/* Top Section - Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Left - Calendar Controls */}
        <div>

          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Calendar View</h3>

            <label htmlFor="startDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Start Date:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!isLoggedIn}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={handleFetchCalendar}
                disabled={fetchingCalendar || !isLoggedIn}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  backgroundColor: fetchingCalendar || !isLoggedIn ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: fetchingCalendar || !isLoggedIn ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {fetchingCalendar ? 'Fetching...' : 'Fetch 7 Days'}
              </button>
            </div>

            {appointments.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                Found {appointments.length} appointment(s)
              </div>
            )}
          </div>
        </div>

        {/* Right - AI Chat */}
        <div>
          <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', height: '100%' }}>
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
        </div>
      </div>

      {/* Bottom Section - Calendar */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>7-Day Calendar</h2>
        <CalendarGrid appointments={appointments} startDate={startDate} />
      </div>
    </div>
  );
}
