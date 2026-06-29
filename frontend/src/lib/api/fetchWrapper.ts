import { TOKEN_KEY } from '@/lib/api/auth';

const IS_BROWSER = typeof window !== 'undefined';

// Desktop mode: use fixed port. Web mode: use relative /api path.
// VITE_API_URL is set by Tauri build or .env file
const getBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (IS_BROWSER) {
    // Check if running inside Tauri (desktop mode)
    // Tauri v2 injects __TAURI_INTERNALS__, v1 injects __TAURI__
    if (
      typeof window !== 'undefined' &&
      ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
    ) {
      return 'http://localhost:19421/api';
    }
    return '/api';
  }
  return 'http://localhost:4000/api';
};

export const API_BASE_URL = getBaseUrl();

export async function request(path: string, options: RequestInit & { auth?: boolean } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  if (options.auth) {
    try {
      // Desktop: backend ignores the token (auto-auth in authMiddleware),
      // but we still send a placeholder so the header format is valid.
      const isDesktop =
        typeof window !== 'undefined' &&
        ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
      const token = isDesktop
        ? 'desktop-token'
        : (typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore
    }
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed');
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  return response;
}
