'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VerificationBadge } from '@/components/shared/BadgeIcon';

// Returns empty string — kept for backward compatibility with any imports
export function getPlanBadgeStyle(): string {
  return '';
}

export function getVerificationBadge(isVerified?: boolean) {
  if (!isVerified) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            <VerificationBadge size="sm" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>ভেরিফাইড অ্যাকাউন্ট</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Simplified — no longer displays subscription plan badges.
 *  Returns a verification badge if `isVerified` is true, otherwise null. */
export default function BadgeDisplay({ isVerified, className = '' }: { isVerified?: boolean; className?: string }) {
  if (!isVerified) return null;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <VerificationBadge size="md" />
    </span>
  );
}

/** Simplified — no longer displays subscription plan badges. Returns null. */
export function BadgeDisplayMini() {
  return null;
}
