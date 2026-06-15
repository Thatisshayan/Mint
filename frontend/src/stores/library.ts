import { apiClient } from '@/lib/api/client';

export async function getLibraryPosts() {
  const res = await apiClient.get('/library/posts');
  return res.json();
}
