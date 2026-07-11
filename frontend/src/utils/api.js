const DEFAULT_DEV_BACKEND_URL = 'http://localhost:8000';

export function getApiBaseUrl(env = import.meta?.env || {}, windowObject = typeof window !== 'undefined' ? window : undefined) {
  const configuredUrl = env?.VITE_API_URL || env?.VITE_BACKEND_URL || env?.BACKEND_URL;
  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (windowObject?.location) {
    const hostname = windowObject.location.hostname || '';
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return DEFAULT_DEV_BACKEND_URL;
    }
    return windowObject.location.origin;
  }

  return DEFAULT_DEV_BACKEND_URL;
}

export function getApiUrl(path, env, windowObject) {
  const baseUrl = getApiBaseUrl(env, windowObject);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
