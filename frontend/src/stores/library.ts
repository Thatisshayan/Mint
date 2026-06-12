import { apiClient } from '@/lib/api/client';

export async function getLibraryPosts() {
  const res = await apiClient.get('/api/library/posts');
  return res.json();
}
