import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useLibrary() {
  return useQuery({
    queryKey: ['library'],
    queryFn: async () => {
      const res = await apiClient.get('/library');
      const data = await res.json();
      return data.items || [];
    },
  });
}

export function useLibrarySearch(query: string) {
  return useQuery({
    queryKey: ['library', 'search', query],
    queryFn: async () => {
      const res = await apiClient.get(`/library/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.items || [];
    },
    enabled: query.length > 0,
  });
}

export function useLibraryItem(id: string) {
  return useQuery({
    queryKey: ['library', id],
    queryFn: async () => {
      const res = await apiClient.get(`/library/${id}`);
      return res.json();
    },
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
    mutationFn: ({ id, updates }: { id: string; updates: { status?: string; tags?: string[]; isFavorite?: boolean } }) =>
      apiClient.patch(`/library/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/library/${id}/toggle-favorite`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useSaveToLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { content: string; platform?: string; status?: string; projectId?: string; tags?: string[] }) => {
      const res = await apiClient.post('/library', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
