import { Appointment } from '@calhighlight/shared';

interface CalendarGridProps {
  appointments: Appointment[];
  startDate: string;
}

export default function CalendarGrid({ appointments, startDate }: CalendarGridProps) {
  // Group appointments by date
  const getAppointmentsByDate = () => {
    const grouped: { [date: string]: Appointment[] } = {};

    appointments.forEach(apt => {
      const date = new Date(apt.startTime).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(apt);
    });

    return grouped;
  };

  // Parse YYYY-MM-DD string to Date in local timezone (not UTC)
  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Generate array of 7 dates starting from startDate
  const getWeekDates = () => {
    const dates = [];
    const start = parseDateString(startDate);
   
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const appointmentsByDate = getAppointmentsByDate();
  const weekDates = getWeekDates();

  if (appointments.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        color: '#666'
      }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No appointments loaded</p>
        <p style={{ fontSize: '0.9rem' }}>Select a start date and click "Fetch 7 Days"</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
      {weekDates.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayAppointments = appointmentsByDate[dateStr] || [];
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
              maxWidth: '200px'
            }}
          >
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

            <div style={{ fontSize: '0.75rem' }}>
              {dayAppointments.length === 0 ? (
                <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center' }}>No events</div>
              ) : (
                dayAppointments.map((apt, idx) => {
                  const startTime = new Date(apt.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <div
                      key={apt.id || idx}
                      style={{
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        backgroundColor: apt.color?.background || '#e3f2fd',
                        borderLeft: `3px solid ${apt.color?.background ? apt.color.background : '#2196f3'}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title={`${apt.summary}\n${apt.location || ''}\n${apt.description || ''}`}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                        {startTime}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {apt.summary}
                      </div>
                      {apt.location && (
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#666',
                          marginTop: '0.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          📍 {apt.location}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
