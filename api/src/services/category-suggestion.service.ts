import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { GoogleCalendarService } from './google-calendar.service';
import { Appointment } from '../models/appointment.model';
import {
  Category,
  CategorySuggestionResponse,
  CategoryConversationMessage,
  CalendarDataSummary
} from '@calhighlight/shared/types/category-suggestion';

// Zod schema for structured output
const CategorySchema = z.object({
  name: z.string().describe('A clear, concise category name (2-4 words max)'),
  colorId: z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']).describe('Google Calendar color ID'),
  description: z.string().describe('A brief explanation of what events belong in this category (1-2 sentences)')
});

const CategorySuggestionSchema = z.object({
  categories: z.array(CategorySchema).min(4).max(6).describe('Array of 4-6 suggested categories'),
  explanation: z.string().describe('Brief explanation of the categories and how they were chosen')
});

// Zod schema for event categorization
const EventCategorizationSchema = z.object({
  eventId: z.string().describe('The ID of the event'),
  suggestedCategoryName: z.string().describe('The name of the category this event belongs to'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the categorization')
});

const EventCategorizationResponseSchema = z.object({
  categorizations: z.array(EventCategorizationSchema).describe('Array of event categorizations'),
  summary: z.string().describe('Brief summary of the categorization results')
});

export class CategorySuggestionService {
  private model: ChatOpenAI;
  private calendarService: GoogleCalendarService;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    this.calendarService = new GoogleCalendarService();
  }

  /**
   * Main entry point for category suggestions
   */
  async suggestCategories(
    message: string | undefined,
    accessToken: string,
    conversationHistory: CategoryConversationMessage[] = []
  ): Promise<CategorySuggestionResponse> {
    console.log('=== CategorySuggestionService.suggestCategories ===');
    console.log('Message present:', !!message);
    console.log('History length:', conversationHistory.length);

    try {
      const phase = this.determinePhase(message, conversationHistory);
      console.log('Phase:', phase);

      let calendarSummary: CalendarDataSummary | undefined;
      let systemMessage: SystemMessage;

      if (phase === 'initial') {
        // Fetch calendar data for initial request
        const { appointments, summary } = await this.fetchCalendarData(accessToken);
        calendarSummary = summary;

        const calendarDataText = this.formatCalendarDataForAI(appointments);
        const systemPrompt = this.buildInitialSystemPrompt();

        systemMessage = new SystemMessage(`${systemPrompt}\n\nCALENDAR DATA:\n${calendarDataText}`);
      } else {
        // Refinement - use refinement prompt
        const systemPrompt = this.buildRefinementSystemPrompt();
        systemMessage = new SystemMessage(systemPrompt);
      }

      // Build conversation messages
      const messages = [
        systemMessage,
        ...this.convertHistoryToMessages(conversationHistory)
      ];

      // Add user message if present (refinement phase)
      if (message) {
        messages.push(new HumanMessage(message));
      }

      // Use structured output to get categories directly
      console.log('Invoking AI with', messages.length, 'messages');
      const modelWithStructuredOutput = this.model.withStructuredOutput(CategorySuggestionSchema);
      const response = await modelWithStructuredOutput.invoke(messages);
      console.log('AI response received with structured output');

      return {
        success: true,
        categories: response.categories,
        message: response.explanation,
        phase,
        calendarDataSummary: calendarSummary
      };
    } catch (error) {
      console.error('Error in category suggestion:', error);
      throw error;
    }
  }

  /**
   * Fetch last 3 months of calendar data
   */
  private async fetchCalendarData(accessToken: string): Promise<{
    appointments: Appointment[];
    summary: CalendarDataSummary;
  }> {
    console.log('Fetching last 3 months of calendar data...');

    const { start, end } = this.getLastThreeMonthsRange();
    const appointments = await this.calendarService.getAppointmentsInRange(start, end, accessToken);

    console.log(`Fetched ${appointments.length} appointments`);

    // Create summary
    const eventTypeCounts = new Map<string, number>();
    for (const apt of appointments) {
      const count = eventTypeCounts.get(apt.summary) || 0;
      eventTypeCounts.set(apt.summary, count + 1);
    }

    const topEventTypes = Array.from(eventTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);

    const summary: CalendarDataSummary = {
      totalEvents: appointments.length,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      topEventTypes
    };

    return { appointments, summary };
  }

  /**
   * Get date range for last 3 months
   */
  private getLastThreeMonthsRange(): { start: Date; end: Date } {
    const end = new Date(); // Today
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setMonth(start.getMonth() - 3); // 3 months ago
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  /**
   * Format calendar data for AI consumption
   * Limits output to ~8000 chars to manage token usage
   */
  private formatCalendarDataForAI(appointments: Appointment[]): string {
    const MAX_CHARS = 8000;

    let formatted = `Total Events: ${appointments.length}\n\n`;

    // Group by summary to find patterns
    const eventCounts = new Map<string, number>();
    for (const apt of appointments) {
      const count = eventCounts.get(apt.summary) || 0;
      eventCounts.set(apt.summary, count + 1);
    }

    // List unique event types with counts
    formatted += 'Event Types (sorted by frequency):\n';
    const sortedEvents = Array.from(eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50); // Top 50 event types

    for (const [summary, count] of sortedEvents) {
      formatted += `- "${summary}" (${count} occurrence${count > 1 ? 's' : ''})\n`;
    }

    // If under char limit, add sample detailed events
    if (formatted.length < MAX_CHARS / 2) {
      formatted += '\n\nSample Events (for additional context):\n';
      const sampleSize = Math.min(30, appointments.length);
      const step = Math.max(1, Math.floor(appointments.length / sampleSize));

      for (let i = 0; i < appointments.length && formatted.length < MAX_CHARS; i += step) {
        const apt = appointments[i];
        formatted += this.formatSingleEvent(apt) + '\n';
      }
    }

    return formatted.substring(0, MAX_CHARS);
  }

  /**
   * Format a single event for AI
   */
  private formatSingleEvent(apt: Appointment): string {
    const date = new Date(apt.startTime).toISOString().split('T')[0];
    const startTime = new Date(apt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(apt.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const duration = Math.round((new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / 60000);

    let details = `  "${apt.summary}" | ${date} ${startTime}-${endTime} (${duration}min)`;

    if (apt.location) {
      details += ` | Location: ${apt.location}`;
    }

    if (apt.attendees && apt.attendees.length > 0) {
      details += ` | ${apt.attendees.length} attendee${apt.attendees.length > 1 ? 's' : ''}`;
    }

    return details;
  }

  /**
   * Build system prompt for initial category suggestion
   */
  private buildInitialSystemPrompt(): string {
    return `
    You are a calendar category suggestion expert. Your task is to analyze a user's calendar data from the past 3 months and suggest 4-6 
    meaningful categories to help them organize their events.

CRITICAL REQUIREMENTS:
1. Suggest exactly 4-6 categories (no more, no less)
2. Each category MUST have:
   - name: A clear, concise category name (1-2 words max)
   - colorId: A Google Calendar color ID (must be '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', or '11')
   - description: A brief explanation of what events belong in this category (1-2 sentences)
3. Assign DIFFERENT color IDs to each category (no duplicates)
4. Categories should be:
   - Mutually exclusive where possible
   - Based on actual patterns in the user's calendar data
   - Practical and actionable
   - Cover the majority of events in the dataset

In your explanation, briefly describe how you identified these categories based on the patterns you observed in the calendar data.

Current date: ${new Date().toISOString().split('T')[0]}

The user's calendar data is provided below. Analyze it carefully and suggest categories that reflect their actual usage patterns.`;
  }

  /**
   * Build system prompt for refinement
   */
  private buildRefinementSystemPrompt(): string {
    return `You are a calendar category suggestion expert. The user has reviewed your previous category suggestions and provided feedback. 
    Your task is to generate a new set of 4-6 categories based on their feedback.

CRITICAL REQUIREMENTS:
1. Generate a new set of categories (the categories may be entirely new or have some overlap with the previous ones)
2. Carefully consider the user's feedback and adjust your suggestions accordingly
3. Still suggest exactly 4-6 categories (no more, no less)
4. Each category MUST have:
   - name: A clear, concise category name (2-4 words max)
   - colorId: A Google Calendar color ID (must be '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', or '11')
   - description: A brief explanation of what events belong in this category (1-2 sentences)
5. Assign DIFFERENT color IDs to each category (no duplicates)
6. Categories should still be based on the calendar data patterns shown earlier in the conversation

In your explanation, describe how you incorporated the user's feedback into these new categories.

Current date: ${new Date().toISOString().split('T')[0]}

Review the conversation history to see the calendar data and previous suggestions, then generate new categories based on the user's feedback.`;
  }

  /**
   * Determine if this is initial or refinement phase
   */
  private determinePhase(
    message: string | undefined,
    conversationHistory: CategoryConversationMessage[]
  ): 'initial' | 'refinement' {
    // Initial phase: no message and no history
    if (!message && conversationHistory.length === 0) {
      return 'initial';
    }
    // Refinement phase: user has provided feedback
    return 'refinement';
  }

  /**
   * Convert conversation history to LangChain messages
   */
  private convertHistoryToMessages(history: CategoryConversationMessage[]): any[] {
    return history.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        // Include categories in the content if present
        let content = msg.content;
        if (msg.categories && msg.categories.length > 0) {
          const categoryList = msg.categories
            .map(c => `- ${c.name} (Color ${c.colorId}): ${c.description}`)
            .join('\n');
          content = `Previous categories suggested:\n${categoryList}\n\n${msg.content}`;
        }
        return new AIMessage(content);
      } else {
        return new SystemMessage(msg.content);
      }
    });
  }

  /**
   * Categorize events based on provided categories
   */
  async categorizeEvents(
    categories: Category[],
    startDate: Date,
    endDate: Date,
    accessToken: string
  ): Promise<{
    success: boolean;
    categorizedEvents?: Array<{
      event: Appointment;
      suggestedCategory: Category | null;
      confidence: 'high' | 'medium' | 'low';
    }>;
    summary?: string;
    error?: string;
  }> {
    console.log('=== CategorySuggestionService.categorizeEvents ===');
    console.log('Categories:', categories.length);
    console.log('Date range:', startDate, 'to', endDate);

    try {
      // Fetch events for the date range
      const appointments = await this.calendarService.getAppointmentsInRange(
        startDate,
        endDate,
        accessToken
      );

      console.log(`Fetched ${appointments.length} appointments to categorize`);

      if (appointments.length === 0) {
        return {
          success: true,
          categorizedEvents: [],
          summary: 'No events found in the specified date range.'
        };
      }

      // Build system prompt
      const systemPrompt = this.buildCategorizationPrompt(categories);

      // Format events for AI
      const eventsText = this.formatEventsForCategorization(appointments);

      const systemMessage = new SystemMessage(`${systemPrompt}\n\nEVENTS TO CATEGORIZE:\n${eventsText}`);

      // Use structured output to get categorizations
      console.log('Invoking AI for event categorization...');
      const modelWithStructuredOutput = this.model.withStructuredOutput(EventCategorizationResponseSchema);
      const response = await modelWithStructuredOutput.invoke([systemMessage]);
      console.log('AI categorization response received');

      // Map categorizations back to events
      const categorizedEvents = appointments.map(event => {
        const categorization = response.categorizations.find(c => c.eventId === event.id);

        if (!categorization) {
          return {
            event,
            suggestedCategory: null,
            confidence: 'low' as const
          };
        }

        // Find the matching category
        const matchedCategory = categories.find(
          cat => cat.name.toLowerCase() === categorization.suggestedCategoryName.toLowerCase()
        );

        return {
          event,
          suggestedCategory: matchedCategory || null,
          confidence: categorization.confidence
        };
      });

      return {
        success: true,
        categorizedEvents,
        summary: response.summary
      };
    } catch (error) {
      console.error('Error in categorizeEvents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build system prompt for event categorization
   */
  private buildCategorizationPrompt(categories: Category[]): string {
    const categoryList = categories
      .map(c => `- "${c.name}": ${c.description}`)
      .join('\n');

    return `You are a calendar event categorization expert. Your task is to assign each event to the most appropriate category 
    from the provided list.

AVAILABLE CATEGORIES:
${categoryList}

INSTRUCTIONS:
1. For each event, analyze its summary, description, location, and attendees
2. Assign it to the MOST APPROPRIATE category from the list above
3. Use the EXACT category name as it appears in the list
4. Provide a confidence level (high/medium/low) for each categorization:
   - high: Clear match with category description
   - medium: Reasonable match but some ambiguity
   - low: Best guess when event doesn't clearly fit any category
5. If an event truly doesn't fit any category, still choose the closest match but mark it as low confidence

In your summary, briefly describe the overall categorization results and any notable patterns.

Current date: ${new Date().toISOString().split('T')[0]}`;
  }

  /**
   * Format events for categorization
   */
  private formatEventsForCategorization(appointments: Appointment[]): string {
    return appointments.map(apt => {
      const startDate = new Date(apt.startTime).toISOString().split('T')[0];
      const startTime = new Date(apt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const duration = Math.round((new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / 60000);

      let details = `Event ID: ${apt.id}\nSummary: "${apt.summary}"\nDate: ${startDate} at ${startTime} (${duration} min)`;

      if (apt.description) {
        // Truncate long descriptions
        const desc = apt.description.length > 100
          ? apt.description.substring(0, 100) + '...'
          : apt.description;
        details += `\nDescription: ${desc}`;
      }

      if (apt.location) {
        details += `\nLocation: ${apt.location}`;
      }

      if (apt.attendees && apt.attendees.length > 0) {
        details += `\nAttendees: ${apt.attendees.length}`;
      }

      return details;
    }).join('\n\n---\n\n');
  }
}
