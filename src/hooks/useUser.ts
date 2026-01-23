import { UserContext } from '../context/userContext';
import type { UserContextType } from '../context/userContext';
import { createContextHook } from './createContextHook';

export const useUser = createContextHook<UserContextType>(
  UserContext,
  'useUser',
  'UserProvider'
);
