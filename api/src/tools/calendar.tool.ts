import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { Appointment } from '../models/appointment.model';

// Zod schema for calendar tool input
export const CalendarToolSchema = z.object({
  date: z.string().describe('A specific date in YYYY-MM-DD format (e.g., "2025-12-15"). Use this for single-day queries.').optional(),
  startDate: z.string().describe('Start date for a date range in YYYY-MM-DD format. Must be used with endDate.').optional(),
  endDate: z.string().describe('End date for a date range in YYYY-MM-DD format. Must be used with startDate.').optional()
});
export type CalendarToolInput = z.infer<typeof CalendarToolSchema>;

// Tool description constant
const TOOL_DESCRIPTION = `Get calendar appointments for a specific date or date range.
Use this tool when the user asks about their schedule, meetings, events, or appointments.
Examples: "What do I have today?", "Show my meetings for tomorrow", "What's on my calendar next week?"
The tool returns a list of appointments with details like title, time, location, and attendees.`;

/**
 * Format a single appointment for display to the LLM
 */
function formatAppointment(appointment: Appointment): string {
  const start = new Date(appointment.startTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const end = new Date(appointment.endTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let result = `- ${appointment.summary} (${start} - ${end})`;

  if (appointment.location) {
    result += `\n  Location: ${appointment.location}`;
  }

  if (appointment.description) {
    result += `\n  Description: ${appointment.description}`;
  }

  if (appointment.attendees && appointment.attendees.length > 0) {
    const attendeeNames = appointment.attendees
      .map(a => a.displayName || a.email)
      .join(', ');
    result += `\n  Attendees: ${attendeeNames}`;
  }

  if (appointment.color) {
    result += `\n  Color: ${appointment.color.background}`;
  }

  return result;
}

/**
 * Format multiple appointments into a response string
 */
function formatAppointmentsResponse(appointments: Appointment[]): string {
  const formatted = appointments.map(formatAppointment).join('\n\n');
  return `Found ${appointments.length} appointment(s):\n\n${formatted}`;
}

/**
 * Parse YYYY-MM-DD string to Date in local timezone (not UTC)
 * Avoids timezone offset issues with new Date("2025-12-15")
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Fetch appointments from the calendar service based on input parameters
 */
async function fetchAppointments(
  input: CalendarToolInput,
  calendarService: GoogleCalendarService,
  accessToken: string
): Promise<Appointment[]> {
  const { date, startDate, endDate } = input;

  console.log('TOOL: === Fetching Appointments ===');
  console.log('TOOL: Parameters:', { date, startDate, endDate });

  // Date range query
  if (startDate && endDate) {
    console.log('TOOL: Using date range query');
    const start = parseDateString(startDate);
    const end = parseDateString(endDate);
    console.log('TOOL: Parsed dates:', { start: start.toISOString(), end: end.toISOString() });
    return await calendarService.getAppointmentsInRange(start, end, accessToken);
  }

  // Single date query
  if (date) {
    console.log('TOOL: Using single date query');
    const targetDate = parseDateString(date);
    console.log('TOOL: Parsed date:', targetDate.toISOString());
    return await calendarService.getAppointments(targetDate, accessToken);
  }

  // Invalid input
  throw new Error('Either "date" or both "startDate" and "endDate" must be provided');
}

/**
 * Execute the calendar tool logic
 */
async function executeCalendarTool(
  input: CalendarToolInput,
  calendarService: GoogleCalendarService,
  accessToken: string
): Promise<string> {
  try {
    console.log('=== Calendar Tool Invoked ===');

    const appointments = await fetchAppointments(input, calendarService, accessToken);
    if (appointments.length === 0) {
      console.log('No appointments found');
      return 'No appointments found for the specified date(s).';
    }
    console.log('Fetched appointments:', appointments.length);

    const response = formatAppointmentsResponse(appointments);
    console.log('Tool returning response, length:', response.length);
    return response;
  } 
  catch (error) 
  {
    console.error('=== Calendar Tool Error ===');
    console.error('Error:', error);

    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }

    const errorMessage = `Error fetching appointments: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('Returning error to agent:', errorMessage);

    return errorMessage;
  }
}

/**
 * Create a LangChain tool for accessing calendar appointments
 */
export function createCalendarTool(accessToken: string): DynamicStructuredTool {
  const calendarService = new GoogleCalendarService();

  // Use 'as any' to bypass TypeScript's excessive type depth checking
  // This is a known issue with LangChain's DynamicStructuredTool and complex Zod schemas
  return new DynamicStructuredTool({
    name: 'get_calendar_appointments',
    description: TOOL_DESCRIPTION,
    schema: CalendarToolSchema as any,
    func: async (input: CalendarToolInput) => executeCalendarTool(input, calendarService, accessToken)
  }) as any;
}
