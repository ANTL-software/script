import { useState, useEffect, useCallback } from 'react';
import { UserContext } from './UserContext';
import { userService } from '../../API/services';

import type { ReactNode } from 'react';
import type { Employe, LoginCredentials } from '../../utils/types';

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<Employe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && userService.hasValidToken();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log('[AUTH] Initializing auth...');

        const storedUser = userService.getStoredUser();
        const hasToken = userService.hasValidToken();
        console.log('[AUTH] storedUser:', !!storedUser);
        console.log('[AUTH] hasToken:', hasToken);

        if (storedUser && hasToken) {
          try {
            const userModel = await userService.getCurrentUser();
            setUser(userModel.toJSON());
            console.log('[AUTH] User validated and set');
          } catch (error) {
            console.error('[AUTH] Failed to validate user session:', error);
            setUser(null);
            userService.clearSession();
          }
        } else {
          console.log('[AUTH] No stored user or token, setting user to null');
          setUser(null);
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[LOGIN] Starting login for:', credentials.identifiant);

      const userModel = await userService.login(credentials);
      console.log('[LOGIN] UserModel received:', userModel.toJSON());
      setUser(userModel.toJSON());
      console.log('[LOGIN] User state set. Checking hasValidToken...');
      console.log('[LOGIN] hasValidToken:', userService.hasValidToken());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Une erreur est survenue lors de la connexion';

      console.error('[LOGIN] Error:', error);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await userService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userModel = await userService.getCurrentUser();
      setUser(userModel.toJSON());
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      await logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
