import { useEffect } from 'react';
import { useNavigation } from './useNavigation.ts';
import { useUser } from './useUser.ts';

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useUser();
  const { navigateTo } = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigateTo('/login', { replace: true });
  }, [isAuthenticated, isLoading, navigateTo]);

  return { isAuthenticated, isLoading };
}
