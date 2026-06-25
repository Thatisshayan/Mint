import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useGenerateContent() {
  return useMutation({
    mutationFn: async (input: { type: string; topic: string; tone?: string; model?: string }) => {
      const res = await apiClient.post('/studio/generate', input);
      return res.json();
    },
  });
}

export function useGenerateIdeas() {
  return useMutation({
    mutationFn: async (input: { projectId: string; brief: string; tone?: string; count?: number }) => {
      const res = await apiClient.post('/studio/generate-ideas', input);
      return res.json();
    },
  });
}

export function useGenerateImage() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiClient.post('/studio/generate-image', { prompt });
      return res.json();
    },
  });
}

export function useAIStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => {
      const res = await apiClient.get('/studio/ai-status');
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
