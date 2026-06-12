import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useResearch(projectId?: string) {
  return useQuery({
    queryKey: ['research', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const url = projectId ? `/api/research?projectId=${encodeURIComponent(projectId)}` : '/api/research';
      const res = await apiClient.get(url);
      if (!res.ok) throw new Error('Failed to load research');
      return res.json();
    },
  });
}

export function useCreateResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; query: string }) => {
      const res = await apiClient.get('/api/research', {
        method: 'POST',
        body: JSON.stringify(input),
        auth: true,
      });
      if (!res.ok) throw new Error('Failed to start research');
      return res.json();
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['research', vars.projectId] }),
  });
}
