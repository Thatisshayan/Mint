import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useGenerateIdeas() {
  return useMutation({
    mutationFn: async (input: { projectId: string; brief: string }) => {
      const res = await apiClient.post('/studio/generate', input);
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
