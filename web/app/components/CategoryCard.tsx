import { useState } from 'react';
import { Category } from '../actions';

interface CategoryCardProps {
  category: Category;
  index: number;
  isEditing: boolean;
  onEdit: (index: number) => void;
  onSave: (index: number, category: Category) => void;
  onCancel: () => void;
  disabled?: boolean;
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

export default function CategoryCard({
  category,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  disabled = false
}: CategoryCardProps) {
  const [editedCategory, setEditedCategory] = useState<Category>(category);

  const handleSave = () => {
    onSave(index, editedCategory);
  };

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: '#fff',
        border: isEditing ? '2px solid #0070f3' : '2px solid #e0e0e0',
        borderRadius: '8px',
        borderLeft: `6px solid ${COLOR_MAP[category.colorId] || '#ccc'}`
      }}
    >
      {isEditing ? (
        // Edit mode
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: COLOR_MAP[editedCategory.colorId] || '#ccc',
                marginRight: '0.5rem',
                flexShrink: 0
              }}
            />
            <input
              type="text"
              value={editedCategory.name}
              onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
              style={{
                flex: 1,
                padding: '0.25rem 0.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                border: '1px solid #0070f3',
                borderRadius: '4px'
              }}
            />
          </div>
          <textarea
            value={editedCategory.description}
            onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.85rem',
              color: '#666',
              lineHeight: '1.4',
              border: '1px solid #0070f3',
              borderRadius: '4px',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '0.5rem'
            }}
          />
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#999',
            marginBottom: '0.75rem'
          }}>
            Color ID: {editedCategory.colorId}
          </div>

          {/* Edit buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✓ Save
            </button>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✕ Cancel
            </button>
          </div>
        </>
      ) : (
        // View mode
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.5rem',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: COLOR_MAP[category.colorId] || '#ccc',
                  marginRight: '0.5rem',
                  flexShrink: 0
                }}
              />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
                {category.name}
              </h4>
            </div>
            <button
              onClick={() => onEdit(index)}
              disabled={disabled}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1
              }}
            >
              ✏️ Edit
            </button>
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#666',
            lineHeight: '1.4'
          }}>
            {category.description}
          </p>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#999'
          }}>
            Color ID: {category.colorId}
          </div>
        </>
      )}
    </div>
  );
}
