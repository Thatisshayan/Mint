const IS_BROWSER = typeof window !== 'undefined';
const TOKEN_KEY = '***';

export const API_BASE_URL = IS_BROWSER
  ? '/api'
  : 'http://localhost:4000/api';

export async function request(path: string, options: RequestInit & { auth?: boolean } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  if (options.auth) {
    try {
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore local env errors
    }
  }

  const response = await fetch(url, { ...options, headers });
  return response;
}
