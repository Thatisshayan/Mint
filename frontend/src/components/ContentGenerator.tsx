import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGenerateContent } from '@/stores/studio';
import { useSaveToLibrary } from '@/stores/library';
import { apiClient } from '@/lib/api/client';
import AIStatusBadge from './AIStatusBadge';
import CostStats from './CostStats';

type GeneratedItem = {
  id: string;
  type: string;
  content: string;
  model?: string;
  provider?: string;
  variationId?: string;
  createdAt: string;
};

const generationFormSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  type: z.enum(['youtube_script', 'instagram_caption', 'thumbnail_prompt', 'hook', 'scenario', 'all']),
  tone: z.enum(['professional', 'casual', 'educational', 'entertaining']),
});

const typeMap: Record<string, string> = {
  youtube_script: 'script',
  instagram_caption: 'caption',
  thumbnail_prompt: 'thumbnail',
  hook: 'hook',
  scenario: 'scenario',
  all: 'full_package',
};

export function ContentGenerator() {
  const generate = useGenerateContent();
  const saveToLibrary = useSaveToLibrary();
  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
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
    try {
      setUserRating(null);
      const result = await generate.mutateAsync({
        type: typeMap[data.type] || data.type,
        topic: data.topic.trim(),
        tone: data.tone,
      });

      const item: GeneratedItem = {
        id: result.id || crypto.randomUUID(),
        type: data.type,
        content: result.content,
        model: result.model,
        provider: result.provider,
        variationId: result.variationId,
        createdAt: result.createdAt || new Date().toISOString(),
      };
      setSelectedItem(item);
    } catch (err) {
      // error is handled by mutation state
    }
  };

  const handleRate = async (rating: number) => {
    if (!selectedItem) return;
    setUserRating(rating);
    try {
      await apiClient.post('/studio/rate', {
        type: selectedItem.type,
        variationId: selectedItem.variationId || 'default',
        rating,
      });
    } catch {
      // rating failed silently
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback('Copied');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleSaveToLibrary = async (item: GeneratedItem) => {
    try {
      await saveToLibrary.mutateAsync({
        content: item.content,
        platform: item.type,
        status: 'draft',
      });
      setCopyFeedback('Saved');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      // save failed silently
    }
  };

  const generateVideoFromScript = useCallback(async (script: string) => {
    setGeneratingVideo(true);
    setVideoUrl(null);
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post('/studio/generate-video', { script, platform: 'youtube_shorts' });
      const data = await res.json();
      if (data.url) setVideoUrl(data.url);
    } catch {
      // video generation failed silently
    } finally {
      setGeneratingVideo(false);
    }
  }, []);

  const generateVoiceover = useCallback(async (text: string) => {
    setGeneratingAudio(true);
    setAudioUrl(null);
    try {
      const { apiClient } = await import('@/lib/api/client');
      const res = await apiClient.post('/studio/generate-voice', { text });
      const data = await res.json();
      if (data.audioUrl) setAudioUrl(data.audioUrl);
    } catch {
      // TTS failed silently
    } finally {
      setGeneratingAudio(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase text-white">
          Content Studio
        </h1>
        <AIStatusBadge />
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
            disabled={isSubmitting || generate.isPending}
            className={`ml-auto h-12 rounded-2xl bg-mint-500 px-8 font-black uppercase tracking-[0.2em] text-mint-950 shadow-[0_20px_40px_rgba(13,148,136,.35)] hover:brightness-110 disabled:opacity-60 ${
              isSubmitting || generate.isPending ? 'opacity-70' : ''
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
            {selectedItem.provider && (
              <div className="text-[10px] text-muted-foreground/50">
                Generated by {selectedItem.provider} · {selectedItem.model}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rate:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    className={`text-lg transition-colors ${
                      userRating && star <= userRating
                        ? 'text-yellow-400'
                        : 'text-muted-foreground/30 hover:text-muted-foreground/60'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {userRating && (
                <span className="text-[10px] text-muted-foreground/50">Thanks for rating!</span>
              )}
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
                onClick={() => handleSaveToLibrary(selectedItem)}
                disabled={saveToLibrary.isPending}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50 disabled:opacity-50"
              >
                {saveToLibrary.isPending ? 'Saving...' : 'Save to library'}
              </button>
              {selectedItem.type === 'youtube_script' && (
                <>
                  <button
                    onClick={() => generateVoiceover(selectedItem.content)}
                    disabled={generatingAudio}
                    className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50 disabled:opacity-50"
                  >
                    {generatingAudio ? 'Generating...' : 'Generate Voiceover'}
                  </button>
                  <button
                    onClick={() => generateVideoFromScript(selectedItem.content)}
                    disabled={generatingVideo}
                    className="rounded-2xl border border-mint-500/30 bg-mint-500/10 p-4 text-left text-sm font-bold text-mint-300 hover:bg-mint-500/20 disabled:opacity-50"
                  >
                    {generatingVideo ? 'Generating video...' : 'Generate Short Video'}
                  </button>
                </>
              )}
            </div>
            {audioUrl && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support audio.
                </audio>
              </div>
            )}
            {videoUrl && (
              <div className="rounded-2xl border border-mint-500/30 bg-mint-500/10 p-4">
                <video controls className="w-full rounded-xl" src={videoUrl}>
                  Your browser does not support video.
                </video>
                <p className="mt-2 text-xs text-mint-400">Video generated — plays below</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <CostStats />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-white">How this works</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1</div>
            <div className="mt-2 text-sm text-white">Enter a topic for your faceless channel content.</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 2</div>
            <div className="mt-2 text-sm text-white">AI generates script, hook, or thumbnail prompt.</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 3</div>
            <div className="mt-2 text-sm text-white">Add voiceover or generate a short video.</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 4</div>
            <div className="mt-2 text-sm text-white">Save to library, copy, or schedule publish.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
