import { CategorizedEvent } from '../actions';

interface CategorizedEventCardProps {
  categorizedEvent: CategorizedEvent;
}

const COLOR_MAP: { [key: string]: string } = {
  '1': '#a4bdfc',  // Lavender
  '2': '#7ae7bf',  // Sage
  '3': '#dbadff',  // Grape
  '4': '#ff887c',  // Flamingo
  '5': '#fbd75b',  // Banana
  '6': '#ffb878',  // Tangerine
  '7': '#46d6db',  // Peacock
  '8': '#e1e1e1',  // Graphite
  '9': '#5484ed',  // Blueberry
  '10': '#51b749', // Basil
  '11': '#dc2127', // Tomato
};

export default function CategorizedEventCard({ categorizedEvent }: CategorizedEventCardProps) {
  const { event, suggestedCategory, confidence } = categorizedEvent;

  const startTime = new Date(event.startTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const currentColor = event.color?.background || '#e3f2fd';
  const suggestedColor = suggestedCategory ? COLOR_MAP[suggestedCategory.colorId] : '#e0e0e0';

  return (
    <div
      style={{
        padding: '0.5rem',
        marginBottom: '0.5rem',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px'
      }}
    >
      {/* Time */}
      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
        {startTime}
      </div>

      {/* Event title */}
      <div style={{
        fontSize: '0.75rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginBottom: '0.5rem'
      }}>
        {event.summary}
      </div>

      {/* Current Color */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.65rem',
        marginTop: '0.5rem'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '2px',
          backgroundColor: currentColor,
          border: '1px solid #999'
        }} />
        <span style={{ color: '#666' }}>Current</span>
      </div>

      {/* Suggested Category */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.65rem',
        marginTop: '0.25rem'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '2px',
          backgroundColor: suggestedColor,
          border: '1px solid #999'
        }} />
        <span style={{
          color: '#666',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          Suggested: {suggestedCategory ? suggestedCategory.name : 'None'}
        </span>
      </div>

      {/* Confidence badge */}
      {suggestedCategory && (
        <div style={{
          marginTop: '0.25rem',
          fontSize: '0.6rem',
          color: confidence === 'high' ? '#10b981' : confidence === 'medium' ? '#fbbf24' : '#ef4444',
          fontWeight: 'bold'
        }}>
          {confidence.toUpperCase()} confidence
        </div>
      )}
    </div>
  );
}
