import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigation } from './useNavigation.ts';
import { useUser } from './useUser.ts';
import { rememberAuthReturnPath } from '../utils/scripts/index.ts';

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useUser();
  const { navigateTo } = useNavigation();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      rememberAuthReturnPath(returnTo);
      navigateTo('/login', {
        replace: true,
        state: { returnTo },
      });
    }
  }, [
    isAuthenticated,
    isLoading,
    location.hash,
    location.pathname,
    location.search,
    navigateTo,
  ]);

  return { isAuthenticated, isLoading };
}
