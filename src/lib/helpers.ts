export const transactionStatusLabels: Record<string, string> = {
  pending_payment: 'পেমেন্ট অপেক্ষমাণ',
  pending_verification: 'যাচাই অপেক্ষমাণ',
  paid: 'পরিশোধিত',
  work_in_progress: 'কাজ চলমান',
  delivered: 'সরবরাহিত',
  completed: 'সম্পন্ন',
  disputed: 'বিরোধিত',
  cancelled: 'বাতিল',
};

export const transactionStatusColors: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  pending_verification: 'bg-orange-100 text-orange-800',
  paid: 'bg-blue-100 text-blue-800',
  work_in_progress: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const paymentStatusLabels: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
};

export const disputeStatusLabels: Record<string, string> = {
  open: 'খোলা',
  under_review: 'পর্যালোচনাধীন',
  resolved_buyer: 'ক্রেতার পক্ষে সমাধান',
  resolved_seller: 'বিক্রেতার পক্ষে সমাধান',
  resolved_cancelled: 'বাতিল সমাধান',
};

export function formatBDT(amount: number): string {
  return '৳' + amount.toLocaleString('bn-BD');
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'এইমাত্র';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${toBanglaNumber(minutes)} মিনিট আগে`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toBanglaNumber(hours)} ঘন্টা আগে`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toBanglaNumber(days)} দিন আগে`;
  const months = Math.floor(days / 30);
  return `${toBanglaNumber(months)} মাস আগে`;
}

export function toBanglaNumber(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return '০';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/[0-9]/g, (d) => banglaDigits[parseInt(d)]);
}

export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}
