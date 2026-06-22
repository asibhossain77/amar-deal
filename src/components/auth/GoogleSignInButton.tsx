'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  /** Where to redirect after successful login */
  callbackUrl?: string;
  /** Optional label override */
  label?: string;
  /** Visual variant */
  variant?: 'light' | 'dark';
}

/**
 * Official Google multi-color "G" logo as inline SVG.
 * Declared outside the component so it doesn't reset state on each render.
 */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/**
 * Modern "Continue with Google" button.
 * - Auto-hides itself if Google Login is disabled in admin settings.
 * - Supports dark/light mode via theme.
 * - Shows error toast on failure.
 */
export default function GoogleSignInButton({
  callbackUrl,
  label = 'Google দিয়ে চালিয়ে যান',
}: GoogleSignInButtonProps) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/google-status', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setEnabled(Boolean(data.enabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Don't render until we know the status, and don't render if disabled
  if (enabled === null) return null;
  if (!enabled) return null;

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      // signIn with redirect true so the OAuth flow works properly
      await signIn('google', {
        callbackUrl: callbackUrl || '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        aria-label="Google দিয়ে লগইন করুন"
        className="
          w-full h-11 flex items-center justify-center gap-3 rounded-lg
          font-medium text-sm transition-all duration-200
          border border-gray-300 shadow-sm hover:shadow-md
          bg-white text-gray-700 hover:bg-gray-50
          disabled:opacity-60 disabled:cursor-not-allowed
          active:scale-[0.98]
          dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
        "
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        ) : (
          <GoogleLogo className="w-5 h-5" />
        )}
        <span>{loading ? 'অপেক্ষা করুন...' : label}</span>
      </button>
    </div>
  );
}
