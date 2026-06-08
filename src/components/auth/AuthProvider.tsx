'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <SessionChecker>{children}</SessionChecker>
    </SessionProvider>
  );
}

function SessionChecker({ children }: { children: React.ReactNode }) {
  const { setUser, isAuthenticated, clearUserData } = useAppStore();
  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether we're in a logout process to prevent re-auth during logout
  const isLoggingOutRef = useRef(false);

  const checkSession = useCallback(async () => {
    // Don't check session if we're in the process of logging out
    if (isLoggingOutRef.current) return;

    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        // Only set user if we're not in logout process
        if (!isLoggingOutRef.current) {
          setUser(data.user);
        }
      } else {
        // Only clear user if we're not in logout process (to avoid race conditions)
        if (!isLoggingOutRef.current) {
          setUser(null);
        }
      }
    } catch {
      if (!isLoggingOutRef.current) {
        setUser(null);
      }
    }
  }, [setUser]);

  // Check session on mount and when NextAuth session changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Only clear user if we had an authenticated state before
      // This prevents clearing user on initial load when not logged in
      if (isAuthenticated) {
        clearUserData();
      }
      isLoggingOutRef.current = false; // Reset logout flag
    } else if (status === 'authenticated' && session) {
      // Reset logout flag since we have a valid session
      isLoggingOutRef.current = false;
      // NextAuth says we're authenticated, verify with our backend
      checkSession();
    }
  }, [session, status, isAuthenticated, clearUserData, checkSession]);

  // Periodic session check every 5 minutes
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkSession]);

  // Also check on window focus (when user comes back to the tab)
  useEffect(() => {
    function handleFocus() {
      checkSession();
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkSession]);

  // Listen for custom logout event from api.logout()
  useEffect(() => {
    function handleLogoutStart() {
      isLoggingOutRef.current = true;
    }
    function handleLogoutComplete() {
      isLoggingOutRef.current = false;
    }
    window.addEventListener('auth:logout-start', handleLogoutStart);
    window.addEventListener('auth:logout-complete', handleLogoutComplete);
    return () => {
      window.removeEventListener('auth:logout-start', handleLogoutStart);
      window.removeEventListener('auth:logout-complete', handleLogoutComplete);
    };
  }, []);

  return <>{children}</>;
}
