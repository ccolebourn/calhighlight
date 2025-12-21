import { Category } from './category';

// Re-export Category for convenience
export type { Category };

export interface CategorySuggestionRequest {
  message?: string;
  conversationHistory?: CategoryConversationMessage[];
}

export interface CategoryConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  categories?: Category[];
}

export interface CategorySuggestionResponse {
  success: boolean;
  categories?: Category[];
  message?: string;
  phase: 'initial' | 'refinement' | 'finalized';
  calendarDataSummary?: CalendarDataSummary;
  error?: string;
  details?: string;
}

export interface CalendarDataSummary {
  totalEvents: number;
  dateRange: {
    start: string; // ISO date string
    end: string;   // ISO date string
  };
  topEventTypes?: string[];
}

export interface CategorizedEvent {
  event: any; // Appointment type - use 'any' to avoid circular dependency
  suggestedCategory: Category | null;
  confidence: 'high' | 'medium' | 'low';
}
