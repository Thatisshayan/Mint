import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/api/client';

type GenerationType = string;

type GeneratedItem = {
  id: string;
  type: GenerationType;
  content: string;
  createdAt: string;
};

type GenerationInput = {
  projectId: string;
  topic: string;
  type: GenerationType;
  tone?: 'professional' | 'casual' | 'educational' | 'entertaining';
};

const typeMap: Record<string, string> = {
  youtube_script: 'script',
  instagram_caption: 'caption',
  thumbnail_prompt: 'thumbnail',
  hook: 'hook',
  scenario: 'scenario',
  all: 'full_package',
};

export function useGenerateContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerationInput) => {
      const res = await apiClient.post('/studio/generate', {
        type: typeMap[input.type] || input.type,
        topic: input.topic,
        tone: input.tone,
      });
      const data = await res.json();
      return {
        items: [{
          id: data.id,
          type: input.type,
          content: data.content,
          createdAt: data.createdAt,
        }],
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useLibraryItems() {
  return useQuery({
    queryKey: ['library'],
    queryFn: (): { items: GeneratedItem[] } => {
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('mint_library') : null;
        return { items: raw ? (JSON.parse(raw) as GeneratedItem[]) : [] };
      } catch {
        return { items: [] };
      }
    },
  });
}

const generationFormSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  type: z.enum(['youtube_script', 'instagram_caption', 'thumbnail_prompt', 'hook', 'scenario', 'all']),
  tone: z.enum(['professional', 'casual', 'educational', 'entertaining']),
});

export function ContentGenerator() {
  const [projectId] = useState('default-project');
  const generate = useGenerateContent();
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof generationFormSchema>>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: {
      topic: '',
      type: 'youtube_script',
      tone: 'educational',
    },
  });

  const onSubmit = async (data: z.infer<typeof generationFormSchema>) => {
    const result = await generate.mutateAsync({
      projectId,
      topic: data.topic.trim(),
      type: data.type,
      tone: data.tone,
    });

    if (result.items?.[0]) setSelectedItem(result.items[0]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback('Copied');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const saveToLibrary = async (item: GeneratedItem) => {
    const current = qc.getQueryData<{ items: GeneratedItem[] }>(['library']);
    const next = { items: [item, ...(current?.items ?? [])] };
    qc.setQueryData(['library'], next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mint_library', JSON.stringify(next.items));
    }
    setCopyFeedback('Saved');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase text-white">
          Content Studio
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Topic / Brief
            </label>
            <input
              {...register('topic')}
              className={`w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none ${
                errors.topic ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 3 AI tools that automate faceless YouTube channels in 2026"
            />
            {errors.topic && (
              <p className="mt-1 text-sm text-red-500">{errors.topic.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Content Type
            </label>
            <select
              {...register('type')}
              className={`h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white focus:border-mint-400 focus:outline-none ${
                errors.type ? 'border-red-500' : ''
              }`}
            >
              <option value="youtube_script">YouTube Script (60s)</option>
              <option value="instagram_caption">Instagram Caption</option>
              <option value="thumbnail_prompt">Thumbnail Prompt</option>
              <option value="hook">Hook Generator (5 openings)</option>
              <option value="scenario">Scenario Planner</option>
              <option value="all">Full Package (All)</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Tone
            </label>
            <select
              {...register('tone')}
              className={`h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white focus:border-mint-400 focus:outline-none ${
                errors.tone ? 'border-red-500' : ''
              }`}
            >
              <option value="educational">Educational</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="entertaining">Entertaining</option>
            </select>
            {errors.tone && (
              <p className="mt-1 text-sm text-red-500">{errors.tone.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`ml-auto h-12 rounded-2xl bg-mint-500 px-8 font-black uppercase tracking-[0.2em] text-mint-950 shadow-[0_20px_40px_rgba(13,148,136,.35)] hover:brightness-110 disabled:opacity-60 ${
              isSubmitting ? 'opacity-70' : ''
            }`}
          >
            {generate.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {generate.isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {(generate.error as Error)?.message}
          </div>
        )}
      </form>

      {selectedItem && (
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Generated Result</h2>
              <button
                onClick={() => copyToClipboard(selectedItem.content)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10"
              >
                {copyFeedback || 'Copy'}
              </button>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                {selectedItem.content}
              </pre>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next actions</h3>
            <div className="grid gap-3">
              <button
                onClick={() => copyToClipboard(selectedItem.content)}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50"
              >
                Copy to clipboard
              </button>
              <button
                onClick={async () => {
                  await saveToLibrary(selectedItem);
                }}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50"
              >
                Save to library
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-bold text-white">How this works</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1</div>
            <div className="mt-2 text-sm text-white">Enter a topic for your faceless channel content.</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2</div>
            <div className="mt-2 text-sm text-white">Generate scripts, captions, or media prompts with Ollama.</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 3</div>
            <div className="mt-2 text-sm text-white">Copy or save into your library for production.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

