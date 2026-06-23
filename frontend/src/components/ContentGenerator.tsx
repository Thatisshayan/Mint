import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

type GenerationType = 'youtube_script' | 'instagram_caption' | 'thumbnail_prompt' | 'all';

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
  duration?: number;
};

export function useGenerateContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerationInput) => {
      const res = await apiClient.post('/studio/generate', input);
      if (!res.ok) throw new Error('Generation failed');
      return res.json() as Promise<{ items: GeneratedItem[] }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library'] });
    },
  });
}

export function useLibraryItems() {
  return useQuery({
    queryKey: ['library'],
    queryFn: async () => {
      const res = await apiClient.get('/library');
      if (!res.ok) throw new Error('Failed to load library');
      return res.json() as Promise<{ items: GeneratedItem[] }>();
    },
  });
}

export function ContentGenerator() {
  const [projectId] = useState('default-project');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<GenerationType>('youtube_script');
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational' | 'entertaining'>('educational');
  const generate = useGenerateContent();
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const result = await generate.mutateAsync({
      projectId,
      topic: topic.trim(),
      type,
      tone,
      duration: type === 'youtube_script' ? 60 : undefined,
    });

    if (result.items?.[0]) setSelectedItem(result.items[0]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback('Copied');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase text-white">
          Content Studio
        </h1>
        <span className="rounded-full bg-mint-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-mint-400">
          Ollama Local
        </span>
      </div>

      <form onSubmit={handleGenerate} className="mt-8 space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Topic / Brief
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              required
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
              placeholder="e.g., 3 AI tools that automate faceless YouTube channels in 2026"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Content Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as GenerationType)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white focus:border-mint-400 focus:outline-none"
            >
              <option value="youtube_script">YouTube Script (60s)</option>
              <option value="instagram_caption">Instagram Caption</option>
              <option value="thumbnail_prompt">Thumbnail Prompt</option>
              <option value="all">Full Package (All)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              className="h-10 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white focus:border-mint-400 focus:outline-none"
            >
              <option value="educational">Educational</option>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="entertaining">Entertaining</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={generate.isPending || !topic.trim()}
            className="ml-auto h-12 rounded-2xl bg-mint-500 px-8 font-black uppercase tracking-[0.2em] text-mint-950 shadow-[0_20px_40px_rgba(13,148,136,.35)] hover:brightness-110 disabled:opacity-60"
          >
            {generate.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {generate.isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {(generate.error as Error).message}
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
                  await apiClient.post('/library', { content: selectedItem.content, type: selectedItem.type });
                  setCopyFeedback('Saved');
                  setTimeout(() => setCopyFeedback(''), 2000);
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
