import { toast as sonnerToast, ExternalToast } from 'sonner';

// Track recent toasts to prevent duplicates
const recentToasts = new Map<string, number>();
const DUPLICATE_THRESHOLD = 1000; // 1 second

function isDuplicate(message: string): boolean {
  const now = Date.now();
  const lastShown = recentToasts.get(message);
  
  if (lastShown && now - lastShown < DUPLICATE_THRESHOLD) {
    return true;
  }
  
  recentToasts.set(message, now);
  
  // Clean up old entries
  if (recentToasts.size > 50) {
    const entries = Array.from(recentToasts.entries());
    entries.sort((a, b) => a[1] - b[1]);
    entries.slice(0, 25).forEach(([key]) => recentToasts.delete(key));
  }
  
  return false;
}

export const toast = {
  success: (message: string, data?: ExternalToast) => {
    if (!isDuplicate(message)) {
      return sonnerToast.success(message, data);
    }
  },
  
  error: (message: string, data?: ExternalToast) => {
    if (!isDuplicate(message)) {
      return sonnerToast.error(message, data);
    }
  },
  
  info: (message: string, data?: ExternalToast) => {
    if (!isDuplicate(message)) {
      return sonnerToast.info(message, data);
    }
  },
  
  warning: (message: string, data?: ExternalToast) => {
    if (!isDuplicate(message)) {
      return sonnerToast.warning(message, data);
    }
  },
  
  // For cases where you need the original toast without deduplication
  raw: sonnerToast,
};
