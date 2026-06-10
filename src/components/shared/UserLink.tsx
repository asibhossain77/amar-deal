'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import type { AppUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getInitials } from '@/lib/helpers';
import { VerificationBadge } from '@/components/shared/BadgeIcon';

interface UserLinkProps {
  user: AppUser | { id: string; name: string; username?: string; avatar?: string; isVerified?: boolean };
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserLink({ user, showAvatar = true, size = 'md', className = '' }: UserLinkProps) {
  const { setSelectedUserId, setPage } = useAppStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUserId(user.id);
    setPage('public-profile');
  };

  const avatarSize = { sm: 'h-6 w-6', md: 'h-8 w-8', lg: 'h-10 w-10' }[size];
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size];
  const verifySize = { sm: 'sm' as const, md: 'md' as const, lg: 'lg' as const }[size];

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 hover:text-primary transition-colors group ${className}`}
      title={`${user.name} এর প্রোফাইল দেখুন`}
    >
      {showAvatar && (
        <Avatar className={avatarSize}>
          {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold group-hover:bg-primary/20 transition-colors">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      )}
      <span className={`${textSize} font-medium text-foreground group-hover:text-primary transition-colors truncate`}>
        {user.name}
      </span>
      {user.isVerified && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <VerificationBadge size={verifySize} />
              </span>
            </TooltipTrigger>
            <TooltipContent>ভেরিফাইড অ্যাকাউন্ট</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </button>
  );
}

// Compact version for tables and lists
export function UserLinkMini({ user, className = '' }: { user: AppUser | { id: string; name: string; username?: string; avatar?: string; isVerified?: boolean }; className?: string }) {
  const { setSelectedUserId, setPage } = useAppStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUserId(user.id);
    setPage('public-profile');
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 hover:underline transition-colors ${className}`}
      title={`${user.name} এর প্রোফাইল দেখুন`}
    >
      {user.name}
      {user.isVerified && (
        <VerificationBadge size="sm" />
      )}
    </button>
  );
}
