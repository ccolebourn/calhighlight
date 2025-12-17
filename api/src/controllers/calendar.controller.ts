import { Request, Response } from 'express';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { ICalendarService } from '../services/calendar.service';

export class CalendarController {
  private calendarService: ICalendarService;

  constructor(provider: string = 'google') {
    // Factory pattern - easily extensible for other providers
    switch (provider.toLowerCase()) {
      case 'google':
        this.calendarService = new GoogleCalendarService();
        break;
      // Future providers can be added here
      // case 'outlook':
      //   this.calendarService = new OutlookCalendarService();
      //   break;
      default:
        this.calendarService = new GoogleCalendarService();
    }
  }

  /**
   * GET /api/calendar/auth
   * Get the authorization URL to initiate OAuth flow
   */
  getAuthUrl = (req: Request, res: Response): void => {
    console.log('=== Generating Auth URL ===');
    console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

    try {
      const authUrl = this.calendarService.getAuthUrl();
      console.log('Auth URL generated successfully');
      console.log('Auth URL:', authUrl);

      res.json({
        success: true,
        authUrl,
        message: 'Visit this URL to authorize the application'
      });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate authorization URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/calendar/callback
   * OAuth callback endpoint to exchange code for tokens
   */
  handleCallback = async (req: Request, res: Response): Promise<void> => {
    console.log('=== OAuth Callback Received ===');
    console.log('Full URL:', req.originalUrl);
    console.log('Query params:', JSON.stringify(req.query, null, 2));
    console.log('Code present:', !!req.query.code);
    console.log('Code type:', typeof req.query.code);

    try {
      const { code, error: oauthError, error_description } = req.query;

      // Check if Google returned an error
      if (oauthError) {
        console.error('OAuth error from Google:', oauthError);
        console.error('Error description:', error_description);
        res.status(400).json({
          success: false,
          error: 'OAuth authorization failed',
          details: error_description || oauthError
        });
        return;
      }

      if (!code || typeof code !== 'string') {
        console.error('Missing or invalid authorization code');
        console.error('Received code:', code);
        res.status(400).json({
          success: false,
          error: 'Authorization code is required',
          details: 'The "code" query parameter is missing or invalid. Did you complete the authorization flow?'
        });
        return;
      }

      console.log('Authorization code received, length:', code.length);
      console.log('Exchanging code for tokens...');

      const tokens = await this.calendarService.getTokenFromCode(code);

      console.log('Tokens received successfully');
      console.log('Access token length:', tokens.access_token?.length);
      console.log('Refresh token present:', !!tokens.refresh_token);

      res.json({
        success: true,
        message: 'Authorization successful',
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date
        },
        instructions: 'Store these tokens securely and use the access_token in subsequent requests'
      });
    } catch (error) {
      console.error('Error in handleCallback:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        error: 'Failed to exchange authorization code',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/calendar/appointments
   * Get appointments for a specific date or date range
   * Query params: date (YYYY-MM-DD) OR startDate and endDate
   * Header: Authorization: Bearer <access_token>
   */
  /**
   * Parse YYYY-MM-DD string to Date in local timezone (not UTC)
   * Avoids timezone offset issues with new Date("2025-12-15")
   */
  private parseDateString(dateStr: string): Date | null {
    const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!parts) return null;

    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // months are 0-indexed
    const day = parseInt(parts[3], 10);

    const date = new Date(year, month, day);

    // Validate that the date is valid (e.g., not Feb 30)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, startDate, endDate } = req.query;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!accessToken) {
        res.status(401).json({
          success: false,
          error: 'Access token is required. Include it in Authorization header as: Bearer <token>'
        });
        return;
      }


      let appointments;

      if (date && typeof date === 'string') {
        console.log('=== Fetching Appointments for date: ', date);
        const targetDate = this.parseDateString(date);
        if (!targetDate) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD'
          });
          return;
        }
        console.log('Fetching appointments for date:', targetDate.toISOString());
        appointments = await this.calendarService.getAppointments(targetDate, accessToken);
      } else if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
        const start = this.parseDateString(startDate);
        const end = this.parseDateString(endDate);
        if (end) end.setHours(23, 59, 59, 999);

        if (!start || !end) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD'
          });
          return;
        }

        console.log('Fetching appointments between dates:', start.toISOString(), 'and', end.toISOString());
        appointments = await this.calendarService.getAppointmentsInRange(start, end, accessToken);
      } else {
        res.status(400).json({
          success: false,
          error: 'Either "date" or both "startDate" and "endDate" query parameters are required'
        });
        return;
      }

      //console.log('Appointments fetched: ', appointments);
      
      res.json({
        success: true,
        count: appointments.length,
        appointments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * PATCH /api/calendar/appointments/:eventId/color
   * Update the color of an appointment
   * Body: { colorId: string }
   * Header: Authorization: Bearer <access_token>
   */
  updateColor = async (req: Request, res: Response): Promise<void> => {
    console.log('=== Updating Appointment Color ===');
    console.log('Event ID:', req.params.eventId);
    console.log('Request body:', req.body);

    try {
      const { eventId } = req.params;
      const { colorId } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!accessToken) {
        res.status(401).json({
          success: false,
          error: 'Access token is required. Include it in Authorization header as: Bearer <token>'
        });
        return;
      }

      if (!eventId) {
        res.status(400).json({
          success: false,
          error: 'Event ID is required'
        });
        return;
      }

      if (!colorId || typeof colorId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'colorId is required in request body',
          example: { colorId: '9' },
          availableColors: 'Color IDs range from 1-11. Each represents a different color in Google Calendar.'
        });
        return;
      }

      console.log(`Updating event ${eventId} to color ${colorId}`);

      const updatedAppointment = await this.calendarService.updateColor(eventId, colorId, accessToken);

      console.log('Color updated successfully');

      res.json({
        success: true,
        message: 'Appointment color updated successfully',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Error updating color:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update appointment color',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
