import { createContext } from 'react';
import type { Employe, LoginCredentials } from '../../utils/types/user.types';

export interface UserContextType {
  user: Employe | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);
