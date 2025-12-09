/**
 * Authentication guard component.
 * 
 * Wraps protected content and redirects to login if user is not authenticated.
 * Uses Firebase Auth to check authentication state.
 * 
 * @module AuthGuard
 */

'use client';

import { useEffect, useState } from 'react';
import { onAuthChange, getCurrentUser, type User } from '@/lib/auth';
import { ResearchDashboardLogin } from './ResearchDashboardLogin';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Authentication guard that protects content behind Firebase Authentication.
 * 
 * @param children - Content to render when authenticated
 * @param fallback - Optional custom component to show when not authenticated (defaults to login form)
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const user = getCurrentUser();
    setIsAuthenticated(user !== null);
    setIsLoading(false);

    // Subscribe to auth state changes
    const unsubscribe = onAuthChange((user: User | null) => {
      setIsAuthenticated(user !== null);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return fallback || <ResearchDashboardLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  // Render protected content
  return <>{children}</>;
}