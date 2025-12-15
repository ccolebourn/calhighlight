import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { getTokensFromCode } from '@/lib/oauth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      new URL('/?error=oauth_failed', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=no_code', request.url)
    );
  }

  try {
    // Exchange code for tokens via Google API
    const tokens = await getTokensFromCode(code);

    // Store tokens in session
    const session = await getIronSession<SessionData>(
      cookies(),
      sessionOptions
    );

    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.expiryDate = tokens.expiry_date;
    session.isLoggedIn = true;

    await session.save();

    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=callback_failed', request.url)
    );
  }
}
