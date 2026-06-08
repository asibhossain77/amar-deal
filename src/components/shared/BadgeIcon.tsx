'use client';

import React from 'react';
import {
  Star,
  Diamond,
  ShieldCheck,
  Building2,
  Crown,
  Store,
  ShoppingCart,
  BadgeCheck,
  Sparkles,
  Flame,
  Trophy,
  CreditCard,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Icon mapping: string identifier → Lucide icon component
// ---------------------------------------------------------------------------
const iconMap: Record<string, React.ElementType> = {
  star: Star,
  diamond: Diamond,
  'shield-check': ShieldCheck,
  building: Building2,
  crown: Crown,
  store: Store,
  'shopping-cart': ShoppingCart,
  check: BadgeCheck,
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
  'credit-card': CreditCard,
};

// ---------------------------------------------------------------------------
// Plan slug → icon identifier mapping
// ---------------------------------------------------------------------------
const planIconMap: Record<string, string> = {
  basic: 'star',
  premium: 'diamond',
  'verified-pro': 'shield-check',
  business: 'building',
  'trusted-elite': 'crown',
};

// ---------------------------------------------------------------------------
// Emoji → identifier migration map (backward compatibility)
// ---------------------------------------------------------------------------
const emojiMigrationMap: Record<string, string> = {
  '\u2B50': 'star',        // ⭐
  '\uD83D\uDC8E': 'diamond', // 💎
  '\u2705': 'shield-check',  // ✅
  '\uD83C\uDFE2': 'building', // 🏢
  '\uD83D\uDC51': 'crown',   // 👑
  '\uD83C\uDFEA': 'store',   // 🏪
  '\uD83D\uDED2': 'shopping-cart', // 🛒
  '\u2713': 'check',        // ✓
  '\uD83C\uDF1F': 'sparkles', // 🌟
  '\uD83D\uDD25': 'flame',   // 🔥
  '\uD83C\uDFC6': 'trophy',  // 🏆
  '\uD83D\uDCB3': 'credit-card', // 💳
};

// ---------------------------------------------------------------------------
// Size classes
// ---------------------------------------------------------------------------
const sizeClasses: Record<string, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

const verificationSizeClasses: Record<string, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

// ---------------------------------------------------------------------------
// Helper: migrate old emoji string to new identifier
// ---------------------------------------------------------------------------
export function getBadgeIconId(raw: string): string {
  if (emojiMigrationMap[raw]) {
    return emojiMigrationMap[raw];
  }
  return raw;
}

// ---------------------------------------------------------------------------
// BadgeIcon component
// ---------------------------------------------------------------------------
export interface BadgeIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeIcon({
  icon,
  size = 'md',
  className = '',
}: BadgeIconProps) {
  const identifier = getBadgeIconId(icon);
  const IconComponent = iconMap[identifier] ?? Zap;
  const sizeClass = sizeClasses[size] ?? sizeClasses.md;

  return <IconComponent className={`${sizeClass} ${className}`.trim()} />;
}

// ---------------------------------------------------------------------------
// PlanIcon component
// ---------------------------------------------------------------------------
export interface PlanIconProps {
  slug: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlanIcon({
  slug,
  size = 'md',
  className = '',
}: PlanIconProps) {
  const identifier = planIconMap[slug] ?? slug;
  const IconComponent = iconMap[identifier] ?? Zap;
  const sizeClass = sizeClasses[size] ?? sizeClasses.md;

  return <IconComponent className={`${sizeClass} ${className}`.trim()} />;
}

// ---------------------------------------------------------------------------
// VerificationBadge component
// ---------------------------------------------------------------------------
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
    <span
      className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white ${sizeClass} ${className}`.trim()}
    >
      <BadgeCheck className="w-full h-full" />
    </span>
  );
}
