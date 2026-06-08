'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import type { PageName } from '@/lib/types';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  backTo?: PageName;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon, backTo, onBack, actions }: PageHeaderProps) {
  const { setPage } = useAppStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      setPage(backTo);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {(backTo || onBack) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0 h-9 w-9 rounded-lg hover:bg-accent transition-colors"
            aria-label="ফিরে যান"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
