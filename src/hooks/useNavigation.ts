import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';

export function useNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigateTo = useCallback((path: string, options?: NavigateOptions): void => {
    void navigate(path, options);
  }, [navigate]);
  const navigateToDashboard = useCallback((): void => {
    const isTestMode = new URLSearchParams(location.search).get('test') === 'true';
    if (isTestMode) {
      window.location.assign('/');
      return;
    }

    void navigate('/');
  }, [location.search, navigate]);

  return {
    navigateTo,
    navigateToDashboard,
    pathname: location.pathname,
    searchParams,
  };
}
