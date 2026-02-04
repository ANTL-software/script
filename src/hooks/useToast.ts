import { ToastContext } from '../context';
import type { ToastContextType } from '../context';
import { createContextHook } from './createContextHook';

export const useToast = createContextHook<ToastContextType>(
  ToastContext,
  'useToast',
  'ToastProvider'
);
