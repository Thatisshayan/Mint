import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function usePublishQueue() {
  return useQuery({
    queryKey: ['publish-queue'],
    queryFn: async () => {
      const res = await apiClient.get('/api/publish/queue');
      if (!res.ok) throw new Error('Failed to load queue');
      return res.json();
    },
  });
}

export function usePublishPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.get(`/api/publish/publish/${id}`, {
        method: 'POST',
        auth: true,
      });
      if (!res.ok) throw new Error('Failed to publish');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['publish-queue'] }),
  });
}
