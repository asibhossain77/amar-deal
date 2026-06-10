'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// BadgeIcon — simplified, no longer renders subscription badge icons.
// Returns null by default. Accepts a size prop for API compatibility.
// ---------------------------------------------------------------------------
export interface BadgeIconProps {
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeIcon({ className }: BadgeIconProps) {
  return null;
}

// ---------------------------------------------------------------------------
// VerificationBadge — a simple green checkmark badge for verified users
// ---------------------------------------------------------------------------
const verificationSizeClasses: Record<string, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export interface VerificationBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerificationBadge({
  size = 'md',
  className = '',
}: VerificationBadgeProps) {
  const sizeClass = verificationSizeClasses[size] ?? verificationSizeClasses.md;

  return (
    <CheckCircle
      className={`${sizeClass} text-emerald-500 ${className}`.trim()}
    />
  );
}
