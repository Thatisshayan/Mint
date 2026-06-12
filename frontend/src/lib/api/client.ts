import { request } from './fetchWrapper';
import { authApi } from './auth';
import type { Session } from './auth';

export const apiClient = {
  async get(url: string) {
    const session: Session | null = await authApi.getSession();
    const headers: HeadersInit = {};
    if (session?.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return request(url, { headers });
  },
  async post(url: string, body: unknown) {
    const session: Session | null = await authApi.getSession();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (session?.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return request(url, { method: 'POST', body: JSON.stringify(body), headers });
  },
  async patch(url: string, body: unknown) {
    const session: Session | null = await authApi.getSession();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (session?.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return request(url, { method: 'PATCH', body: JSON.stringify(body), headers });
  },
  async del(url: string) {
    const session: Session | null = await authApi.getSession();
    const headers: HeadersInit = {};
    if (session?.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.accessToken}`;
    }
    return request(url, { method: 'DELETE', headers });
  },
};
