import { useState } from 'react';
import { useCreateResearch } from '@/stores/research';

export default function Research() {
  const [query, setQuery] = useState('');
  const create = useCreateResearch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ query });
    setQuery('');
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-black uppercase text-white">Research</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-x-2 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
          placeholder="Competitor or keyword"
        />
        <button
          type="submit"
          className="h-12 rounded-2xl bg-mint-500 px-6 font-black uppercase tracking-[0.2em] text-mint-950 hover:brightness-110 disabled:opacity-60"
        >
          Run
        </button>
      </form>
    </div>
  );
}
