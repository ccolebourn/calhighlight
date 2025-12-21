import { Category } from '../actions';
import CategoryCard from './CategoryCard';

interface CategoryGridProps {
  categories: Category[];
  editingCategoryIndex: number | null;
  onEdit: (index: number) => void;
  onSave: (index: number, category: Category) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function CategoryGrid({
  categories,
  editingCategoryIndex,
  onEdit,
  onSave,
  onCancel,
  disabled = false
}: CategoryGridProps) {
  return (
    <div>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
        Suggested Categories ({categories.length})
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            category={category}
            index={index}
            isEditing={editingCategoryIndex === index}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
