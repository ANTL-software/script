import { AppContext } from '../context/appContext';
import type { AppContextType } from '../context/appContext';
import { createContextHook } from './createContextHook';

export const useApp = createContextHook<AppContextType>(
  AppContext,
  'useApp',
  'AppProvider'
);
