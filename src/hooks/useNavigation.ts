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

  return {
    navigateTo,
    pathname: location.pathname,
    searchParams,
  };
}
