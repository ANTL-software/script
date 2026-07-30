const AUTH_RETURN_PATH_STORAGE_KEY = 'antl_auth_return_path';

export function normalizeAuthReturnPath(value: unknown): string | null {
  if (
    typeof value !== 'string'
    || !value.startsWith('/')
    || value.startsWith('//')
    || value === '/login'
    || value.startsWith('/login?')
    || value.startsWith('/login#')
  ) {
    return null;
  }

  return value;
}

export function getAuthReturnPathFromState(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) return null;
  return normalizeAuthReturnPath(Reflect.get(state, 'returnTo'));
}

export function rememberAuthReturnPath(returnPath: string): void {
  const normalizedPath = normalizeAuthReturnPath(returnPath);
  if (!normalizedPath || typeof window === 'undefined') return;
  window.sessionStorage.setItem(AUTH_RETURN_PATH_STORAGE_KEY, normalizedPath);
}

export function rememberCurrentAuthReturnPath(): void {
  if (typeof window === 'undefined') return;
  rememberAuthReturnPath(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

export function consumeAuthReturnPath(preferredPath: string | null): string {
  if (typeof window === 'undefined') return preferredPath ?? '/';

  const rememberedPath = normalizeAuthReturnPath(
    window.sessionStorage.getItem(AUTH_RETURN_PATH_STORAGE_KEY),
  );
  window.sessionStorage.removeItem(AUTH_RETURN_PATH_STORAGE_KEY);

  return preferredPath ?? rememberedPath ?? '/';
}
