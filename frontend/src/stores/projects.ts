import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get('/api/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      return res.json();
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const res = await apiClient.get('/api/projects', {
        method: 'POST',
        body: JSON.stringify(input),
        auth: true,
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
