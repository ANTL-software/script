import { ProspectContext } from '../context/prospectContext';
import type { ProspectContextType } from '../context/prospectContext';
import { createContextHook } from './createContextHook';

export const useProspect = createContextHook<ProspectContextType>(
  ProspectContext,
  'useProspect',
  'ProspectProvider'
);
