'use client';

import { useState } from 'react';
import { Appointment } from '@calhighlight/shared';
import { fetchCalendarAppointments } from '../actions';
import CalendarGrid from './CalendarGrid';

interface CalendarViewProps {
  isLoggedIn: boolean;
}

export default function CalendarView({ isLoggedIn }: CalendarViewProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fetchingCalendar, setFetchingCalendar] = useState(false);

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

  return (
    <>
      {/* Calendar Controls */}
      <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '2rem' }}>
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

      {/* Calendar Grid */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>7-Day Calendar</h2>
        <CalendarGrid appointments={appointments} startDate={startDate} />
      </div>
    </>
  );
}
