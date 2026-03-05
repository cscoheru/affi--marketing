/**
 * Authentication Context Provider
 * Provides authentication state and methods throughout the app
 */

"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './hooks';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for development
const DEMO_USER: User = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { DEMO_USER };
