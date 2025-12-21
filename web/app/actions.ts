'use server';

import { Appointment } from '@calhighlight/shared';
import type {
  Category,
  CategoryConversationMessage,
  CalendarDataSummary,
  CategorizedEvent
} from '@calhighlight/shared/types/category-suggestion';
import { getValidAccessToken, getSession } from '@/lib/auth-helpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchCalendarAppointments(
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  appointments?: Appointment[];
  error?: string;
  needsLogin?: boolean;
}> {
  // Get valid token (auto-refreshes if needed)
  const { token, error } = await getValidAccessToken();

  if (!token) {
    return {
      success: false,
      error: error || 'Not authenticated',
      needsLogin: true,
    };
  }

  try {
    console.log('Fetching calendar appointments for date range:', startDate, endDate);
    const res = await fetch(
      `${API_BASE_URL}/api/calendar/appointments?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      }
    );

    const data = await res.json();

    // Handle token expiration from backend
    if (res.status === 401) {
      return {
        success: false,
        error: 'Authentication expired',
        needsLogin: true,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function chatWithAI(
  message: string
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
  needsLogin?: boolean;
}> {
  const { token, error } = await getValidAccessToken();

  if (!token) {
    return {
      success: false,
      error: error || 'Not authenticated',
      needsLogin: true,
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/calendar/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message }),
      cache: 'no-store'
    });

    const data = await res.json();

    if (res.status === 401) {
      return {
        success: false,
        error: 'Authentication expired',
        needsLogin: true,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getSessionStatus(): Promise<{
  isLoggedIn: boolean;
  expiryDate: number;
}> {
  const session = await getSession();

  return {
    isLoggedIn: session.isLoggedIn,
    expiryDate: session.expiryDate,
  };
}

// Re-export types for convenience
export type { Category, CategoryConversationMessage, CalendarDataSummary, CategorizedEvent };

export async function suggestCategories(
  message?: string,
  conversationHistory?: CategoryConversationMessage[]
): Promise<{
  success: boolean;
  categories?: Category[];
  message?: string;
  phase?: 'initial' | 'refinement' | 'finalized';
  calendarDataSummary?: CalendarDataSummary;
  error?: string;
  needsLogin?: boolean;
}> {
  const { token, error } = await getValidAccessToken();

  if (!token) {
    return {
      success: false,
      error: error || 'Not authenticated',
      needsLogin: true,
    };
  }

  try {
    console.log('Suggesting categories with message:', message);
    const res = await fetch(`${API_BASE_URL}/api/calendar/suggest-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        conversationHistory: conversationHistory || []
      }),
      cache: 'no-store'
    });

    const data = await res.json();

    if (res.status === 401) {
      return {
        success: false,
        error: 'Authentication expired',
        needsLogin: true,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function categorizeEvents(
  categories: Category[],
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  categorizedEvents?: CategorizedEvent[];
  summary?: string;
  error?: string;
  needsLogin?: boolean;
}> {
  const { token, error } = await getValidAccessToken();

  if (!token) {
    return {
      success: false,
      error: error || 'Not authenticated',
      needsLogin: true,
    };
  }

  try {
    console.log('Categorizing events for date range:', startDate, endDate);
    const res = await fetch(`${API_BASE_URL}/api/calendar/categorize-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        categories,
        startDate,
        endDate
      }),
      cache: 'no-store'
    });

    const data = await res.json();

    if (res.status === 401) {
      return {
        success: false,
        error: 'Authentication expired',
        needsLogin: true,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
