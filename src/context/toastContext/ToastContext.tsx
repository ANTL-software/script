import { createContext } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
