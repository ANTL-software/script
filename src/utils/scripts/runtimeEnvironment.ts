export interface RuntimeEnvironmentVariables {
  VITE_API_BASE_URL?: string;
  VITE_API_TEST_BASE_URL?: string;
}

type RuntimeGlobal = typeof globalThis & {
  _mockEnv?: RuntimeEnvironmentVariables;
};

function alignLoopbackApiHostname(apiUrl: string): string {
  try {
    const parsedUrl = new URL(apiUrl);
    const pageHostname = window.location.hostname;
    const loopbackHostnames = new Set(['localhost', '127.0.0.1']);

    if (
      loopbackHostnames.has(parsedUrl.hostname)
      && loopbackHostnames.has(pageHostname)
    ) {
      parsedUrl.hostname = pageHostname;
    }

    return parsedUrl.toString().replace(/\/+$/, '');
  } catch {
    return apiUrl.replace(/\/+$/, '');
  }
}

export function isTestEnvironment(): boolean {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isDevPort = ['5173', '5174', '5175'].includes(window.location.port);
  return isDev && isDevPort;
}

export function shouldDisableLocalTwilio(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return isProspectTestMode()
    || (isTestEnvironment() && window.localStorage.getItem('antl_disable_twilio') === '1');
}

export function isProspectTestMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('test') === 'true';
}

function getRuntimeEnvironmentVariables(): RuntimeEnvironmentVariables {
  const runtimeGlobal = globalThis as RuntimeGlobal;
  return typeof import.meta.env !== 'undefined'
    ? import.meta.env as unknown as RuntimeEnvironmentVariables
    : runtimeGlobal._mockEnv ?? {};
}

function isLoopbackUrl(url: string | undefined): boolean {
  return Boolean(url && (url.includes('localhost') || url.includes('127.0.0.1')));
}

export function getProductionApiBaseUrl(): string {
  const configuredProdUrl = getRuntimeEnvironmentVariables().VITE_API_BASE_URL?.trim();

  if (!configuredProdUrl || isLoopbackUrl(configuredProdUrl)) {
    return 'https://api.antl.fr/api';
  }

  return configuredProdUrl.replace(/\/+$/, '');
}

export function getTestApiBaseUrl(): string {
  const configuredTestUrl = getRuntimeEnvironmentVariables().VITE_API_TEST_BASE_URL?.trim();

  if (isTestEnvironment()) {
    return alignLoopbackApiHostname(configuredTestUrl || 'http://localhost:8800/api');
  }

  if (!configuredTestUrl || isLoopbackUrl(configuredTestUrl)) {
    return 'https://api-test.antl.fr/api';
  }

  return configuredTestUrl.replace(/\/+$/, '');
}

export function getSessionMarkerName(): 'session_active' | 'session_active_test' {
  return isProspectTestMode() && !isTestEnvironment()
    ? 'session_active_test'
    : 'session_active';
}

export function getApiBaseUrl(): string {
  // En environnement de test local (localhost/127.0.0.1)
  if (isTestEnvironment()) {
    return getTestApiBaseUrl();
  }

  // En mode test hors localhost (ex: ?test=true sur la prod)
  if (isProspectTestMode()) {
    return getTestApiBaseUrl();
  }

  return getProductionApiBaseUrl();
}
