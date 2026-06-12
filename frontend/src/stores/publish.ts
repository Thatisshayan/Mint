import { apiClient } from '@/lib/api/client';

export async function getPublishQueue() {
  const res = await apiClient.get('/api/publish/queue');
  return res.json();
}
