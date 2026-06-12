import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export async function getProjects() {
  const response = await apiClient.get('/projects');
  if (!response.ok) throw new Error('Failed to load projects.');
  return response.json();
}

export function useProjects() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const create = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const response = await apiClient.post('/projects', payload);
      if (!response.ok) throw new Error('Failed to create project.');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
  return { ...list, create };
}
