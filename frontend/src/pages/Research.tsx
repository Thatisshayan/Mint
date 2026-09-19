import { useEffect, useState } from 'react';
import { useResearch } from '@/stores/research';
import { useResearchStream } from '@/hooks/useResearchStream';

export default function Research() {
  const [query, setQuery] = useState('');
  const { data, refetch } = useResearch();
  const stream = useResearchStream();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    stream.start(query.trim());
  };

  // Refetch exactly once per completed run, not on every render — `stream.result`
  // is a stable reference set once by the 'done' message, so this effect only
  // re-fires when a *new* result object arrives.
  useEffect(() => {
    if (stream.status === 'done' && stream.result) {
      refetch();
    }
  }, [stream.status, stream.result, refetch]);

  const reports = data?.reports ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-black uppercase text-white">Research</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-2 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={stream.status === 'connecting' || stream.status === 'researching'}
          className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
          placeholder="Competitor or keyword"
        />
        <button
          type="submit"
          disabled={stream.status === 'connecting' || stream.status === 'researching'}
          className="h-12 rounded-2xl bg-mint-500 px-6 font-black uppercase tracking-[0.2em] text-mint-950 hover:brightness-110 disabled:opacity-60"
        >
          Run
        </button>
      </form>

      {(stream.status === 'connecting' || stream.status === 'researching') && (
        <div className="mt-4 rounded-2xl border border-white/5 bg-black/30 p-4 text-xs text-muted-foreground">
          {stream.logs.length === 0 ? (
            <p>Connecting...</p>
          ) : (
            <ul className="space-y-1">
              {stream.logs.map((log, i) => (
                <li key={i}>{log}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {stream.status === 'error' && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {stream.error || 'Research failed.'}
          <button onClick={() => stream.start(query)} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {reports.map((report: any) => {
          const citations = report.citations ? JSON.parse(report.citations) : [];
          const isReal = report.source === 'gpt-researcher';
          return (
            <div key={report.id} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">{report.query}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isReal ? 'bg-mint-500/20 text-mint-300' : 'bg-white/10 text-muted-foreground'
                  }`}
                >
                  {isReal ? 'Web Research' : 'AI Guess'}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{report.summary}</p>
              {citations.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-white/5 pt-3 text-xs">
                  {citations.map((c: { title: string; url: string }, i: number) => (
                    <li key={i}>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-mint-400 hover:underline">
                        {c.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
