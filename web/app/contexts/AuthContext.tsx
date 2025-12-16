'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSessionStatus } from '../actions';

interface AuthContextType {
  isLoggedIn: boolean;
  checkingAuth: boolean;
  handleLogin: () => void;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const status = await getSessionStatus();
      setIsLoggedIn(status.isLoggedIn);
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, checkingAuth, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
