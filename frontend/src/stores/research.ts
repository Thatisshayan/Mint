import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useResearch(projectId?: string) {
  return useQuery({
    queryKey: ['research', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const url = projectId ? `/research?projectId=${encodeURIComponent(projectId)}` : '/research';
      const res = await apiClient.get(url);
      return res.json();
    },
  });
}

export function useCreateResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; query: string }) => {
      const res = await apiClient.post('/research', input);
      return res.json();
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['research', vars.projectId] }),
  });
}
