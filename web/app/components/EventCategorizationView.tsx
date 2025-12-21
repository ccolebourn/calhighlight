import { useState } from 'react';
import { Category, CategorizedEvent, categorizeEvents } from '../actions';
import CategorizedEventCard from './CategorizedEventCard';

interface EventCategorizationViewProps {
  categories: Category[];
}

export default function EventCategorizationView({ categories }: EventCategorizationViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [categorizedEvents, setCategorizedEvents] = useState<CategorizedEvent[]>([]);
  const [categorizationSummary, setCategorizationSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCategorizeEvents = async () => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    setLoading(true);
    setError('');

    // Calculate 7-day range
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    end.setDate(end.getDate() + 6);

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    const result = await categorizeEvents(categories, startDateStr, endDateStr);

    if (result.needsLogin) {
      alert('Your session has expired. Please login again.');
      setLoading(false);
      return;
    }

    if (!result.success) {
      setError(result.error || 'Failed to categorize events');
      setLoading(false);
      return;
    }

    if (result.categorizedEvents) {
      setCategorizedEvents(result.categorizedEvents);
      setCategorizationSummary(result.summary || '');
    }

    setLoading(false);
  };

  // Group events by date
  const getEventsByDate = () => {
    const eventsByDate: { [date: string]: CategorizedEvent[] } = {};
    categorizedEvents.forEach(ce => {
      const date = new Date(ce.event.startTime).toISOString().split('T')[0];
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(ce);
    });
    return eventsByDate;
  };

  // Generate 7 dates
  const getWeekDates = () => {
    const dates = [];
    const start = new Date(selectedDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const eventsByDate = getEventsByDate();
  const weekDates = getWeekDates();

  return (
    <div style={{
      marginTop: '3rem',
      padding: '2rem',
      backgroundColor: '#f0f9ff',
      borderRadius: '8px',
      border: '2px solid #0070f3'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#0070f3' }}>
        📅 View Categorized Events
      </h3>
      <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.95rem' }}>
        Select a start date to see 7 days of events with both their current colors and AI-suggested category colors.
      </p>

      {/* Date picker and button */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Start Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
            style={{
              padding: '0.5rem',
              fontSize: '0.95rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          onClick={handleCategorizeEvents}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '1.5rem'
          }}
        >
          {loading ? 'Loading Events...' : '📊 Fetch & Categorize 7 Days'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* AI Summary */}
      {categorizationSummary && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontStyle: 'italic'
        }}>
          <strong>AI Summary:</strong> {categorizationSummary}
        </div>
      )}

      {/* Event grid */}
      {categorizedEvents.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '1rem' }}>
            Events ({categorizedEvents.length})
          </h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
            overflowX: 'auto'
          }}>
            {weekDates.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateStr] || [];
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = date.getDate();
              const monthName = date.toLocaleDateString('en-US', { month: 'short' });

              return (
                <div
                  key={dateStr}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    minHeight: '200px',
                    minWidth: '150px'
                  }}
                >
                  {/* Date header */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid #0070f3'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold' }}>{dayName}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dayNum}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{monthName}</div>
                  </div>

                  {/* Events for this day */}
                  <div style={{ fontSize: '0.75rem' }}>
                    {dayEvents.length === 0 ? (
                      <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center' }}>No events</div>
                    ) : (
                      dayEvents.map((ce, idx) => (
                        <CategorizedEventCard key={ce.event.id || idx} categorizedEvent={ce} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
