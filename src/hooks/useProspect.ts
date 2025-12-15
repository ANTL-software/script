import { useContext } from 'react';
import { ProspectContext } from '../context/prospectContext';
import type { ProspectContextType } from '../context/prospectContext';

export const useProspect = (): ProspectContextType => {
  const context = useContext(ProspectContext);
  if (!context) {
    throw new Error('useProspect must be used within a ProspectProvider');
  }
  return context;
};
