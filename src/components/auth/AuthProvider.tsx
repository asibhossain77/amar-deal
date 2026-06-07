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
  const { setUser } = useAppStore();
  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [setUser]);

  // Check session on mount and when NextAuth session changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      setUser(null);
    } else if (status === 'authenticated' && session) {
      // NextAuth says we're authenticated, verify with our backend
      checkSession();
    }
  }, [session, status, setUser, checkSession]);

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

  return <>{children}</>;
}
