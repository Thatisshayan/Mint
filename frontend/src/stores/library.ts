import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useLibrary() {
  return useQuery({
    queryKey: ['library'],
    queryFn: () => apiClient.get('/library').then((res: any) => res.items),
  });
}

export function useLibraryItem(id: string) {
  return useQuery({
    queryKey: ['library', id],
    queryFn: () => apiClient.get(`/library/${id}`),
    enabled: !!id,
  });
}

export function useDeleteLibraryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del(`/library/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useUpdateLibraryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { status?: string } }) =>
      apiClient.patch(`/library/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useSaveToLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; platform?: string; status?: string; projectId?: string }) =>
      apiClient.post('/library', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
