import { useContext } from 'react';
import { AppContext } from '../context/appContext';
import type { AppContextType } from '../context/appContext';

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
