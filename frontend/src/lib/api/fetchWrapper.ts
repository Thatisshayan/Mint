const IS_BROWSER = typeof window !== 'undefined';

export const API_BASE_URL = IS_BROWSER
  ? import.meta.env.VITE_API_URL ?? '/api'
  : process.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function fetchWrapper(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;

  const onUnauthorized = async () => {
    await authApi.signOut();
    if (IS_BROWSER) {
      window.location.assign('/');
    }
  };

  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok && init?.auth !== false) {
    if (response.status === 401) {
      void onUnauthorized();
    }
  }

  return response;
}
