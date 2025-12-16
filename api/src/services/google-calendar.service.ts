import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ICalendarService } from './calendar.service';
import { Appointment, CalendarProvider, Attendee, Organizer, EventColor } from '../models/appointment.model';

export class GoogleCalendarService implements ICalendarService {
  private oauth2Client: OAuth2Client;
  private colorCache: Map<string, { background: string; foreground: string }> = new Map();

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async getTokenFromCode(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expiry_date: tokens.expiry_date!
    };
  }

  async getAppointments(date: Date, accessToken: string): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getAppointmentsInRange(startOfDay, endOfDay, accessToken);
  }

  async getAppointmentsInRange(
    startDate: Date,
    endDate: Date,
    accessToken: string
  ): Promise<Appointment[]> {
    // If startDate and endDate are the exact same, expand to full day
    if (startDate.getTime() === endDate.getTime()) {
      const dateToExpand = new Date(startDate);
      startDate = new Date(dateToExpand);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(dateToExpand);
      endDate.setHours(23, 59, 59, 999);

      console.log(`Same start/end date detected. Expanded to full day: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }

    this.oauth2Client.setCredentials({
      access_token: accessToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Fetch colors if not already cached
    if (this.colorCache.size === 0) {
      await this.fetchColors(calendar);
    }

    console.log(`Fetching appointments in service between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items || [];

    return events.map(event => this.mapGoogleEventToAppointment(event));
  }

  private async fetchColors(calendar: any): Promise<void> {
    try {
      console.log('Fetching Google Calendar colors...');
      const colorsResponse = await calendar.colors.get();
      const eventColors = colorsResponse.data.event || {};

      for (const [colorId, colorData] of Object.entries(eventColors)) {
        const color = colorData as any;
        this.colorCache.set(colorId, {
          background: color.background,
          foreground: color.foreground
        });
      }

      console.log(`Cached ${this.colorCache.size} event colors`);
    } catch (error) {
      console.error('Failed to fetch colors:', error);
    }
  }

  private mapGoogleEventToAppointment(event: any): Appointment {
    const startTime = event.start.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start.date);

    const endTime = event.end.dateTime
      ? new Date(event.end.dateTime)
      : new Date(event.end.date);

    const attendees: Attendee[] | undefined = event.attendees?.map((attendee: any) => ({
      email: attendee.email,
      displayName: attendee.displayName,
      responseStatus: attendee.responseStatus as any
    }));

    const organizer: Organizer | undefined = event.organizer ? {
      email: event.organizer.email,
      displayName: event.organizer.displayName
    } : undefined;

    // Map color information
    let color: EventColor | undefined = undefined;
    if (event.colorId) {
      const cachedColor = this.colorCache.get(event.colorId);
      if (cachedColor) {
        color = {
          id: event.colorId,
          background: cachedColor.background,
          foreground: cachedColor.foreground
        };
      }
    }

    return {
      id: event.id,
      summary: event.summary || 'No title',
      description: event.description,
      location: event.location,
      startTime,
      endTime,
      attendees,
      organizer,
      status: event.status || 'confirmed',
      htmlLink: event.htmlLink,
      provider: CalendarProvider.GOOGLE,
      color
    };
  }

  async updateColor(eventId: string, colorId: string, accessToken: string): Promise<Appointment> {
    this.oauth2Client.setCredentials({
      access_token: accessToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    console.log(`Updating event ${eventId} with color ID ${colorId}`);

    // Fetch colors if not already cached
    if (this.colorCache.size === 0) {
      await this.fetchColors(calendar);
    }

    // Validate color ID
    if (!this.colorCache.has(colorId)) {
      throw new Error(`Invalid color ID: ${colorId}. Valid IDs are: ${Array.from(this.colorCache.keys()).join(', ')}`);
    }

    // Update the event with the new color
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        colorId: colorId
      }
    });

    console.log('Event color updated successfully');

    return this.mapGoogleEventToAppointment(response.data);
  }
}
