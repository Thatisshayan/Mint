import { useState, type FormEvent } from 'react';
import { useGenerateIdeas } from '@/stores/studio';

type Idea = {
  id: string;
  title: string;
  brief: string;
};

export default function Studio() {
  const [brief, setBrief] = useState('');
  const generate = useGenerateIdeas();
  const [projectId] = useState('demo-project');
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const handleGenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await generate.mutateAsync({ projectId, brief });
    setIdeas(result.ideas ?? []);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-black uppercase text-white">Studio</h1>
      <form onSubmit={handleGenerate} className="mt-8 space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
          placeholder="Paste a brief, topic, or angle…"
        />
        <button
          type="submit"
          className="h-12 rounded-2xl bg-mint-500 px-6 font-black uppercase tracking-[0.2em] text-mint-950 hover:brightness-110 disabled:opacity-60"
        >
          Generate ideas
        </button>
      </form>
      <div className="mt-8 grid gap-4">
        {ideas.map((idea) => (
          <div key={idea.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-base font-bold text-white">{idea.title}</div>
            <div className="text-sm text-muted-foreground">{idea.brief}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
