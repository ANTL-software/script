export function isTestEnvironment(): boolean {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isDevPort = ['5173', '5174', '5175'].includes(window.location.port);
  return isDev && isDevPort;
}

export function shouldDisableLocalTwilio(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return isTestEnvironment() && window.localStorage.getItem('antl_disable_twilio') === '1';
}

export function isProspectTestMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('test') === 'true';
}

export function getApiBaseUrl(): string {
  const configuredProdUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const configuredTestUrl = import.meta.env.VITE_API_TEST_BASE_URL?.trim();

  if (isTestEnvironment()) {
    return (configuredTestUrl || configuredProdUrl || 'http://localhost:8800/api').replace(/\/+$/, '');
  }

  if (isProspectTestMode()) {
    if (!configuredTestUrl) {
      throw new Error('VITE_API_TEST_BASE_URL est requis pour utiliser le mode test hors localhost.');
    }
    return configuredTestUrl.replace(/\/+$/, '');
  }

  return (configuredProdUrl || 'https://api.antl.fr/api').replace(/\/+$/, '');
}
