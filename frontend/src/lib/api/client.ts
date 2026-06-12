import { authApi } from '@/lib/api/auth';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

export const apiClient = {
  async get(url: string) {
    const session = await authApi.getSession();
    const headers: HeadersInit = {};
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return fetchWrapper(url, { headers, auth: true });
  },

  async post(url: string, body: unknown) {
    const session = await authApi.getSession();
    const headers: HeadersInit = {};
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return fetchWrapper(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
      auth: true,
    });
  },

  async patch(url: string, body: unknown) {
    const session = await authApi.getSession();
    const headers: HeadersInit = {};
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return fetchWrapper(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers,
      auth: true,
    });
  },

  async del(url: string) {
    const session = await authApi.getSession();
    const headers: HeadersInit = {};
    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return fetchWrapper(url, {
      method: 'DELETE',
      headers,
      auth: true,
    });
  },
};
