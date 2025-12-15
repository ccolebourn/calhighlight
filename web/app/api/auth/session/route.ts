import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(
      cookies(),
      sessionOptions
    );

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn || false,
      expiryDate: session.expiryDate || 0,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { isLoggedIn: false, expiryDate: 0 }
    );
  }
}
