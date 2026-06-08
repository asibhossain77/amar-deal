'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SubscriptionPlan } from '@/lib/types';

interface BadgeDisplayProps {
  plan?: SubscriptionPlan | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const PLAN_SLUG_ORDER: Record<string, number> = {
  'basic': 0,
  'premium': 1,
  'verified-pro': 2,
  'business': 3,
  'trusted-elite': 4,
};

export function getPlanBadgeStyle(slug: string, color: string): string {
  switch (slug) {
    case 'premium':
      return `bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800`;
    case 'verified-pro':
      return `bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800`;
    case 'business':
      return `bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800`;
    case 'trusted-elite':
      return `bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800`;
    default:
      return `bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  }
}

export function getVerificationBadge(isVerified?: boolean) {
  if (!isVerified) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] cursor-help">
            ✓
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>ভেরিফাইড অ্যাকাউন্ট</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function BadgeDisplay({ plan, size = 'md', showLabel = true, className = '' }: BadgeDisplayProps) {
  if (!plan || plan.slug === 'basic') {
    if (!showLabel) return null;
    return (
      <Badge
        variant="outline"
        className={`text-xs border-0 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ${className}`}
      >
        ⭐ Basic
      </Badge>
    );
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0 h-5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const iconSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${sizeClasses[size]} ${getPlanBadgeStyle(plan.slug, plan.badgeColor)} cursor-help font-medium ${className}`}
          >
            <span className={iconSize[size]}>{plan.badgeIcon}</span>
            {showLabel && <span className="ml-1">{plan.name}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{plan.name}</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">{plan.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BadgeDisplayMini({ plan, className = '' }: { plan?: SubscriptionPlan | null; className?: string }) {
  if (!plan || plan.slug === 'basic') return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs cursor-help ${className}`}
            style={{ backgroundColor: plan.badgeColor + '20', color: plan.badgeColor }}
          >
            {plan.badgeIcon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{plan.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { PLAN_SLUG_ORDER };
