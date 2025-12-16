import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from './session';
import { refreshAccessToken } from './oauth';

/* 
 * Get a valid access token from the session.
 * If the token is expired or about to expire, refresh it.
 * If the refresh fails, return an error and destroy the session.
 * @returns { token, error? } - The valid access token or if the token is null, then an error message.
 */
export async function getValidAccessToken(): Promise<{
  token: string | null;
  error?: string;
}> {
  const session = await getIronSession<SessionData>(
    cookies(),
    sessionOptions
  );

  // Check if logged in
  if (!session.isLoggedIn) {
    return { token: null, error: 'Not logged in' };
  }

  // Check if token is expired (with 5-minute buffer)
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (session.expiryDate - bufferMs < now) {
    // Token expired or about to expire - refresh it
    try {
      const refreshed = await refreshAccessToken(session.refreshToken);

      // Update session with new tokens
      session.accessToken = refreshed.access_token;
      session.expiryDate = refreshed.expiry_date;
      await session.save();

      return { token: refreshed.access_token };
    } catch (error) {
      // Refresh failed - session is invalid
      session.destroy();
      return { token: null, error: 'Session expired, please login again' };
    }
  }

  // Token is still valid
  return { token: session.accessToken };
}

/* 
 * Get the current session data.
 * @returns { accessToken, refreshToken, expiryDate, isLoggedIn } - The current session data.
 */
export async function getSession(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(
    cookies(),
    sessionOptions
  );

  return {
    accessToken: session.accessToken || '',
    refreshToken: session.refreshToken || '',
    expiryDate: session.expiryDate || 0,
    isLoggedIn: session.isLoggedIn || false,
  };
}
