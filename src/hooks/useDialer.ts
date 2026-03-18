import { createContextHook } from './createContextHook';
import { DialerContext } from '../context/dialerContext/DialerContext';
import type { DialerContextType } from '../context/dialerContext/DialerContext';

export const useDialer = createContextHook<DialerContextType>(
  DialerContext,
  'useDialer',
  'DialerProvider'
);
