import { useEffect, useState } from 'react';
import { getSalutation, getSalutationRefreshDelay } from '../utils/scripts/index.ts';
import type { SalutationAudience } from '../utils/scripts/index.ts';

interface DynamicGreetingOptions {
  audience: SalutationAudience;
  prenom?: string;
}

export function useDynamicGreeting({ audience, prenom }: DynamicGreetingOptions): string {
  const getGreeting = (): string => getSalutation(prenom, undefined, undefined, audience);
  const [greeting, setGreeting] = useState<string>(getGreeting);

  useEffect(() => {
    const refresh = (): void => setGreeting(getGreeting());
    let timeoutId: number;
    const scheduleRefresh = (): void => {
      timeoutId = window.setTimeout(() => {
      refresh();
      scheduleRefresh();
      }, getSalutationRefreshDelay());
    };
    scheduleRefresh();
    const refreshWhenVisible = (): void => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [audience, prenom]);

  return greeting;
}
