'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const pathname = usePathname();
  const { isLoggedIn, handleLogin, handleLogout } = useAuth();

  const isActive = (path: string) => pathname === path;

  const tabStyle = (path: string) => ({
    padding: '0.75rem 1.5rem',
    textDecoration: 'none',
    color: isActive(path) ? '#0070f3' : '#666',
    fontWeight: isActive(path) ? 'bold' : 'normal',
    borderBottom: isActive(path) ? '2px solid #0070f3' : '2px solid transparent',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  });

  return (
    <div style={{
      padding: '1rem 2rem',
      maxWidth: '1400px',
      margin: '0 auto',
      borderBottom: '1px solid #e0e0e0',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h1 style={{ margin: 0 }}>Calendar Highlight</h1>

        {/* Login/Logout Button */}
        <div>
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                Logged in
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Login with Google
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Link href="/calendar" style={tabStyle('/calendar')}>
          Calendar
        </Link>
        <Link href="/chat" style={tabStyle('/chat')}>
          Chat
        </Link>
        <Link href="/highlight" style={tabStyle('/highlight')}>
          Highlight
        </Link>
      </nav>
    </div>
  );
}
