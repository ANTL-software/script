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

        const storedUser = userService.getStoredUser();
        const hasToken = userService.hasValidToken();

        if (storedUser && hasToken) {
          try {
            const userModel = await userService.getCurrentUser();
            setUser(userModel.toJSON());
          } catch (error) {
            console.error('Failed to validate user session:', error);
            setUser(null);
            userService.clearSession();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
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

      const userModel = await userService.login(credentials);
      setUser(userModel.toJSON());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Une erreur est survenue lors de la connexion';

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
