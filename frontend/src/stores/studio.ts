import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useGenerateIdeas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectId: string; brief: string }) => {
      const res = await apiClient.get('/api/studio/generate', {
        method: 'POST',
        body: JSON.stringify(input),
        auth: true,
      });
      if (!res.ok) throw new Error('Failed to generate ideas');
      return res.json();
    },
  });
}

export function useGenerateImage() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiClient.get('/api/studio/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        auth: true,
      });
      if (!res.ok) throw new Error('Failed to generate image');
      return res.json();
    },
  });
}
