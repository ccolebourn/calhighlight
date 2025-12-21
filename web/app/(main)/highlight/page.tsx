'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { suggestCategories, Category, CategoryConversationMessage, CalendarDataSummary } from '../../actions';
import CategoryGrid from '../../components/CategoryGrid';
import EventCategorizationView from '../../components/EventCategorizationView';

export default function HighlightPage() {
  const { isLoggedIn } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [calendarSummary, setCalendarSummary] = useState<CalendarDataSummary | null>(null);
  const [conversationHistory, setConversationHistory] = useState<CategoryConversationMessage[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [error, setError] = useState('');

  // Category editing state
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);

  const handleGenerateCategories = async () => {
    setLoading(true);
    setError('');

    const result = await suggestCategories();

    if (result.needsLogin) {
      alert('Your session has expired. Please login again.');
      setLoading(false);
      return;
    }

    if (!result.success) {
      setError(result.error || 'Failed to generate categories');
      setLoading(false);
      return;
    }

    if (result.categories && result.message) {
      setCategories(result.categories);
      setAiMessage(result.message);
      setCalendarSummary(result.calendarDataSummary || null);

      // Add to conversation history
      setConversationHistory([{
        role: 'assistant',
        content: result.message,
        categories: result.categories
      }]);
    }

    setLoading(false);
  };

  const handleRefineCategories = async () => {
    if (!feedbackInput.trim()) {
      alert('Please provide feedback to refine the categories.');
      return;
    }

    setLoading(true);
    setError('');

    // Add user feedback to history
    const newHistory: CategoryConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', content: feedbackInput }
    ];

    const result = await suggestCategories(feedbackInput, conversationHistory);

    if (result.needsLogin) {
      alert('Your session has expired. Please login again.');
      setLoading(false);
      return;
    }

    if (!result.success) {
      setError(result.error || 'Failed to refine categories');
      setLoading(false);
      return;
    }

    if (result.categories && result.message) {
      setCategories(result.categories);
      setAiMessage(result.message);

      // Update conversation history with new response
      setConversationHistory([
        ...newHistory,
        {
          role: 'assistant',
          content: result.message,
          categories: result.categories
        }
      ]);

      setFeedbackInput('');
    }

    setLoading(false);
  };

  const handleStartOver = () => {
    setCategories([]);
    setAiMessage('');
    setCalendarSummary(null);
    setConversationHistory([]);
    setFeedbackInput('');
    setError('');
    setEditingCategoryIndex(null);
  };

  const handleEditCategory = (index: number) => {
    setEditingCategoryIndex(index);
  };

  const handleSaveCategory = (index: number, category: Category) => {
    const newCategories = [...categories];
    newCategories[index] = category;
    setCategories(newCategories);
    setEditingCategoryIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingCategoryIndex(null);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>AI-Powered Category Suggestions</h2>

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
          <p>Please login with Google to generate category suggestions for your calendar.</p>
        </div>
      )}

      {/* Only show content if logged in */}
      {isLoggedIn && (
        <>
          {/* Description */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0070f3',
            borderRadius: '8px',
            marginBottom: '2rem',
          }}>
            <p style={{ margin: 0, color: '#333', fontSize: '0.95rem' }}>
              Let AI analyze your calendar from the past 3 months and suggest 4-6 categories
              to help you organize your events. You can refine the suggestions until satisfied.
            </p>
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

          {/* Calendar Summary */}
          {calendarSummary && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9f9f9',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <strong>Analyzed Calendar Data:</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>{calendarSummary.totalEvents} events from {calendarSummary.dateRange.start} to {calendarSummary.dateRange.end}</li>
                {calendarSummary.topEventTypes && calendarSummary.topEventTypes.length > 0 && (
                  <li>Top event types: {calendarSummary.topEventTypes.slice(0, 5).join(', ')}</li>
                )}
              </ul>
            </div>
          )}

          {/* Generate button (only show if no categories yet) */}
          {categories.length === 0 && (
            <button
              onClick={handleGenerateCategories}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                backgroundColor: loading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '2rem'
              }}
            >
              {loading ? 'Analyzing Calendar...' : '✨ Generate Categories'}
            </button>
          )}

          {/* AI Message */}
          {aiMessage && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              fontSize: '0.95rem',
              fontStyle: 'italic',
              color: '#374151'
            }}>
              <strong>AI:</strong> {aiMessage}
            </div>
          )}

          {/* Categories Display */}
          {categories.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <CategoryGrid
                categories={categories}
                editingCategoryIndex={editingCategoryIndex}
                onEdit={handleEditCategory}
                onSave={handleSaveCategory}
                onCancel={handleCancelEdit}
                disabled={loading}
              />

              {/* Refinement Section */}
              <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>
                  Refine These Categories
                </h4>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide feedback to refine the categories. For example: 'I want more specific work categories' or 'Combine personal and family into one category'"
                  disabled={loading}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    fontSize: '0.95rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    marginBottom: '1rem'
                  }}
                />

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleRefineCategories}
                    disabled={loading || !feedbackInput.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      backgroundColor: (loading || !feedbackInput.trim()) ? '#ccc' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (loading || !feedbackInput.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? 'Refining...' : '🔄 Refine Categories'}
                  </button>

                  <button
                    onClick={handleStartOver}
                    disabled={loading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      backgroundColor: 'white',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    🔄 Start Over
                  </button>
                </div>

                <div style={{
                  marginTop: '1rem',
                  fontSize: '0.85rem',
                  color: '#10b981',
                  fontWeight: 'bold'
                }}>
                  ✓ Happy with these categories? You can use them to organize your calendar events!
                </div>
              </div>

              {/* Event Categorization View */}
              <EventCategorizationView categories={categories} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
