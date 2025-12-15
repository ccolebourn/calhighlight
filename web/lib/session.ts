import { SessionOptions } from 'iron-session';

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  accessToken: '',
  refreshToken: '',
  expiryDate: 0,
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'calhighlight_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  },
};
