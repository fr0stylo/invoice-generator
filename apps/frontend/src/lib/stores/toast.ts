import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

export const toasts = writable<Toast[]>([]);

let toastCounter = 0;

export function addToast(toast: Omit<Toast, 'id'>): string {
  const id = `toast-${++toastCounter}`;
  const newToast: Toast = {
    id,
    duration: 5000,
    dismissible: true,
    ...toast,
    // Ensure duration is not undefined
    duration: toast.duration !== undefined ? toast.duration : 5000,
  };

  toasts.update(currentToasts => [...currentToasts, newToast]);

  return id;
}

export function removeToast(id: string) {
  toasts.update(currentToasts => currentToasts.filter(toast => toast.id !== id));
}

export function clearAllToasts() {
  toasts.set([]);
}

// Convenience functions
export function showSuccess(title: string, message?: string, duration?: number) {
  return addToast({ type: 'success', title, message, duration });
}

export function showError(title: string, message?: string, duration?: number) {
  return addToast({ type: 'error', title, message, duration });
}

export function showWarning(title: string, message?: string, duration?: number) {
  return addToast({ type: 'warning', title, message, duration });
}

export function showInfo(title: string, message?: string, duration?: number) {
  return addToast({ type: 'info', title, message, duration });
}