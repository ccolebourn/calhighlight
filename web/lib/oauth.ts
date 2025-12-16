import { google } from 'googleapis';

/**
 * Google OAuth 2.0 client setup
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Scopes required for the Google Calendar API
 */
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Generates the Google OAuth 2.0 authorization URL.
 * @returns The Auth URL to start the OAuth process
 */
export function getAuthUrl(): string {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to always get refresh token
  });

  return authUrl;
}

export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('No access token received');
  }

  if (!tokens.refresh_token) {
    throw new Error('No refresh token received');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + (3600 * 1000), // Default 1 hour
  };
}

/* 
 * Refreshes the access token using the provided refresh token.
 * @param refreshToken - The refresh token to use for refreshing the access token.
 * @returns A promise that resolves to an object containing the new access token and expiry date.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date: number;
}> {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date || Date.now() + (3600 * 1000), // Default 1 hour
  };
}
