import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useLibraryPosts() {
  return useQuery({
    queryKey: ['library', 'posts'],
    queryFn: async () => {
      const res = await apiClient.get('/api/library/posts');
      if (!res.ok) throw new Error('Failed to load posts');
      return res.json();
    },
  });
}
