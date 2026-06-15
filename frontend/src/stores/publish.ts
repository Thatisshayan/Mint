import { apiClient } from '@/lib/api/client';

export async function getPublishQueue() {
  const res = await apiClient.get('/publish/queue');
  return res.json();
}
