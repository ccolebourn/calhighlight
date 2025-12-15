import { Appointment } from '../models/appointment.model';

export interface ICalendarService {
  /**
   * Get appointments for a specific date
   * @param date The date to get appointments for
   * @param accessToken OAuth access token for the calendar provider
   * @returns Array of appointments for the specified date
   */
  getAppointments(date: Date, accessToken: string): Promise<Appointment[]>;

  /**
   * Get appointments within a date range
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @param accessToken OAuth access token for the calendar provider
   * @returns Array of appointments within the specified date range
   */
  getAppointmentsInRange(startDate: Date, endDate: Date, accessToken: string): Promise<Appointment[]>;

  /**
   * Get the authorization URL for OAuth flow
   * @returns Authorization URL to redirect user to
   */
  getAuthUrl(): string;

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from OAuth callback
   * @returns Access token and refresh token
   */
  getTokenFromCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }>;

  /**
   * Update the color of an appointment
   * @param eventId The ID of the event to update
   * @param colorId The color ID to set (Google Calendar color IDs: 1-11)
   * @param accessToken OAuth access token for the calendar provider
   * @returns Updated appointment
   */
  updateColor(eventId: string, colorId: string, accessToken: string): Promise<Appointment>;
}
