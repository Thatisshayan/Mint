import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function usePublishQueue() {
  return useQuery({
    queryKey: ['publish'],
    queryFn: async () => {
      const res = await apiClient.get('/publish');
      const data = await res.json();
      return data.queue || [];
    },
  });
}

export function usePublishItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiClient.post('/publish', { postId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publish'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useDeletePublishItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del(`/publish/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publish'] });
    },
  });
}
