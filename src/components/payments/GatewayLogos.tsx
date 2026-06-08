'use client';

import React from 'react';

// bKash Logo - Pink brand mark
export function BkashLogo({ className = 'h-8 w-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#E2136E" />
      <path d="M14 14h6v6h-6z" fill="white" opacity="0.9" />
      <path d="M22 14h6v6h-6z" fill="white" opacity="0.7" />
      <path d="M30 14h6v6h-6z" fill="white" opacity="0.5" />
      <path d="M14 22h6v6h-6z" fill="white" opacity="0.7" />
      <path d="M22 22h6v6h-6z" fill="white" opacity="0.9" />
      <path d="M30 22h6v6h-6z" fill="white" opacity="0.7" />
      <path d="M18 30h14v4H18z" fill="white" opacity="0.8" rx="2" />
      <text x="24" y="37" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">bKash</text>
    </svg>
  );
}

// Nagad Logo - Orange brand mark
export function NagadLogo({ className = 'h-8 w-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#F6921E" />
      <circle cx="24" cy="20" r="8" fill="white" opacity="0.9" />
      <path d="M20 20l4-6 4 6z" fill="#F6921E" />
      <path d="M16 28h16c0 4-3.6 7-8 7s-8-3-8-7z" fill="white" opacity="0.8" />
      <text x="24" y="40" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">নগদ</text>
    </svg>
  );
}

// Rocket Logo - Purple brand mark
export function RocketLogo({ className = 'h-8 w-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#8B2F8B" />
      <path d="M24 10c-2 4-6 8-6 14 0 4 2.7 6 6 6s6-2 6-6c0-6-4-10-6-14z" fill="white" opacity="0.9" />
      <circle cx="24" cy="22" r="3" fill="#8B2F8B" />
      <path d="M18 32c0 2 2.7 4 6 4s6-2 6-4" fill="white" opacity="0.6" />
      <path d="M20 36h8" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <text x="24" y="43" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">Rocket</text>
    </svg>
  );
}

// Upay Logo - Blue brand mark
export function UpayLogo({ className = 'h-8 w-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#1A7DC4" />
      <path d="M18 14l6 10-6 10h6l6-10-6-10z" fill="white" opacity="0.9" />
      <circle cx="30" cy="24" r="4" fill="white" opacity="0.6" />
      <text x="24" y="42" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="sans-serif">UPay</text>
    </svg>
  );
}

// Bank Transfer Logo - Navy blue brand mark
export function BankLogo({ className = 'h-8 w-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#1E5AA8" />
      <path d="M24 12l14 8H10z" fill="white" opacity="0.9" />
      <rect x="13" y="21" width="4" height="12" fill="white" opacity="0.7" rx="1" />
      <rect x="22" y="21" width="4" height="12" fill="white" opacity="0.7" rx="1" />
      <rect x="31" y="21" width="4" height="12" fill="white" opacity="0.7" rx="1" />
      <rect x="10" y="34" width="28" height="3" fill="white" opacity="0.8" rx="1" />
    </svg>
  );
}

// Stripe Logo
export function StripeLogo({ className = 'h-8 w-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#635BFF" />
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">S</text>
      <path d="M16 34c2 1 4 1.5 6 1.5 6 0 10-3 10-8 0-7-10-5-10-8 0-1.5 1.5-2 3.5-2 2 0 4 .5 6 1.5v-5c-2-.8-4-1-6-1-6 0-9 3-9 7 0 7 10 4.5 10 8 0 1.5-1.5 2-4 2-2 0-4.5-.5-6.5-1.5z" fill="white" opacity="0.9" />
    </svg>
  );
}

// PayPal Logo
export function PayPalLogo({ className = 'h-8 w-8', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill="#003087" />
      <path d="M20 12h8c4 0 7 2.5 6 7-.8 4-4 7-8 7h-4l-2 8h-5l5-22z" fill="#0070E0" opacity="0.9" />
      <path d="M22 14h6c3 0 5 2 4.5 5.5-.5 3-3 5.5-6 5.5h-3l-1.5 6h-4l4-17z" fill="white" opacity="0.85" />
    </svg>
  );
}

// Generic Wallet Logo
export function WalletLogo({ className = 'h-8 w-8', size = 32, color = '#6BBF59' }: { className?: string; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <rect width="48" height="48" rx="12" fill={color} />
      <rect x="8" y="16" width="32" height="20" rx="3" fill="white" opacity="0.9" />
      <rect x="8" y="16" width="32" height="8" rx="3" fill="white" opacity="0.6" />
      <circle cx="34" cy="26" r="3" fill={color} />
    </svg>
  );
}

// Get the right logo component based on gateway slug
export function getGatewayLogoComponent(slug: string) {
  const s = slug.toLowerCase();
  if (s.includes('bkash')) return BkashLogo;
  if (s.includes('nagad')) return NagadLogo;
  if (s.includes('rocket')) return RocketLogo;
  if (s.includes('upay') || s.includes('u-pay')) return UpayLogo;
  if (s.includes('bank')) return BankLogo;
  if (s.includes('stripe')) return StripeLogo;
  if (s.includes('paypal')) return PayPalLogo;
  return null; // Will fallback to icon-based display
}

// Get brand color based on slug
export function getGatewayBrandColor(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes('bkash')) return '#E2136E';
  if (s.includes('nagad')) return '#F6921E';
  if (s.includes('rocket')) return '#8B2F8B';
  if (s.includes('upay') || s.includes('u-pay')) return '#1A7DC4';
  if (s.includes('bank')) return '#1E5AA8';
  if (s.includes('stripe')) return '#635BFF';
  if (s.includes('paypal')) return '#003087';
  return '#6BBF59';
}

// Step indicators for the payment flow
export function StepIndicator({ 
  currentStep, 
  totalSteps = 3,
  labels 
}: { 
  currentStep: number; 
  totalSteps?: number; 
  labels?: string[] 
}) {
  const defaultLabels = ['গেটওয়ে নির্বাচন', 'পেমেন্টের তথ্য', 'জমা দিন'];
  const stepLabels = labels || defaultLabels;

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 w-full max-w-md mx-auto mb-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        
        return (
          <React.Fragment key={stepNum}>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div 
                className={`
                  flex items-center justify-center rounded-full transition-all duration-300 ease-out
                  ${isCompleted 
                    ? 'w-6 h-6 sm:w-7 sm:h-7 bg-primary text-primary-foreground' 
                    : isActive 
                      ? 'w-6 h-6 sm:w-7 sm:h-7 bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2' 
                      : 'w-5 h-5 sm:w-6 sm:h-6 bg-muted text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-[10px] sm:text-xs font-bold">{stepNum}</span>
                )}
              </div>
              <span className={`hidden sm:inline text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-muted-foreground'
              }`}>
                {stepLabels[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div className={`flex-1 h-0.5 rounded transition-colors duration-300 ${
                isCompleted ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
