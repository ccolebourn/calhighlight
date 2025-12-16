'use client';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { checkingAuth } = useAuth();

  if (checkingAuth) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main style={{ padding: '0 2rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </AuthProvider>
  );
}
