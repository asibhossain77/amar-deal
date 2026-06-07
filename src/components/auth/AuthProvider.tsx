'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionChecker>{children}</SessionChecker>
    </SessionProvider>
  );
}

function SessionChecker({ children }: { children: React.ReactNode }) {
  const { setUser, user } = useAppStore();

  useEffect(() => {
    async function checkSession() {
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
    }

    if (!user) {
      checkSession();
    }
  }, [setUser, user]);

  return <>{children}</>;
}
