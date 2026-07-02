export function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';

  const filteredParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      filteredParams[key] = String(value);
    }
  });

  const entries = Object.keys(filteredParams);
  if (entries.length === 0) return '';

  return `?${new URLSearchParams(filteredParams).toString()}`;
}
