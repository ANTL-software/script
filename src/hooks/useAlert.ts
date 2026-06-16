import { createContextHook } from './createContextHook';
import { AlertContext } from '../context/alertContext/AlertContext';
import type { AlertContextType } from '../context/alertContext/AlertContext';

export const useAlert = createContextHook<AlertContextType>(
  AlertContext,
  'useAlert',
  'AlertProvider'
);
