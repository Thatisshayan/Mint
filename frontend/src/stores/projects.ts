import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get('/api/projects');
      return res.json();
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const res = await apiClient.post('/api/projects', input);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
