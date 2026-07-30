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
  const runtimeGlobal = globalThis as RuntimeGlobal;
  const env: RuntimeEnvironmentVariables = typeof import.meta.env !== 'undefined'
    ? import.meta.env as unknown as RuntimeEnvironmentVariables
    : runtimeGlobal._mockEnv ?? {};
  const configuredProdUrl = env.VITE_API_BASE_URL?.trim();
  const configuredTestUrl = env.VITE_API_TEST_BASE_URL?.trim();

  // En environnement de test local (localhost/127.0.0.1)
  if (isTestEnvironment()) {
    // Si une URL de test est spécifiée, on l'utilise, sinon on fallback sur le port local par défaut 8800
    // On n'utilise plus configuredProdUrl par défaut pour éviter d'attaquer la prod en local par accident
    // Le même hostname loopback est conservé pour que les cookies SameSite=Lax
    // restent envoyés entre Vite et l'API locale.
    return alignLoopbackApiHostname(configuredTestUrl || 'http://localhost:8800/api');
  }

  // En mode test hors localhost (ex: ?test=true sur la prod)
  if (isProspectTestMode()) {
    const isLocalTestUrl = configuredTestUrl && (configuredTestUrl.includes('localhost') || configuredTestUrl.includes('127.0.0.1'));
    if (!configuredTestUrl || isLocalTestUrl) {
      return 'https://api-test.antl.fr/api';
    }
    return configuredTestUrl.replace(/\/+$/, '');
  }

  // En production
  // Si l'URL de prod configurée contient localhost ou 127.0.0.1 (erreur fréquente de build avec le .env de dev),
  // on l'ignore et on utilise l'URL de production réelle.
  const isLocalProdUrl = configuredProdUrl && (configuredProdUrl.includes('localhost') || configuredProdUrl.includes('127.0.0.1'));
  if (!configuredProdUrl || isLocalProdUrl) {
    return 'https://api.antl.fr/api';
  }

  return configuredProdUrl.replace(/\/+$/, '');
}
