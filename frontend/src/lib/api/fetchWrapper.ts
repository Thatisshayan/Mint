import { TOKEN_KEY } from '@/lib/api/auth';

const IS_BROWSER = typeof window !== 'undefined';

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
  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed');
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  return response;
}
