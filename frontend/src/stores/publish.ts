import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function usePublishQueue() {
  return useQuery({
    queryKey: ['publish'],
    queryFn: () => apiClient.get('/publish').then((res: any) => res.queue),
  });
}

export function usePublishItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.post('/publish', { postId }),
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
