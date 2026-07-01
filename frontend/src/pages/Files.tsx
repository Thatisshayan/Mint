import { useMemo } from 'react';
import {
  useFiles,
  useFilesConfig,
  SUBDIR_LABELS,
  SUBDIR_DESCRIPTIONS,
  type MintFileEntry,
  type MintSubdir,
} from '@/stores/files';
import Skeleton from '@/components/ui/Skeleton';

const POLITE_SUBTYPES: MintSubdir[] = [
  'audio',
  'video',
  'images',
  'comfyui',
  'mpt',
  'transcripts',
];

function formatBytes(kb: number): string {
  if (kb < 1) return '<1 KB';
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString();
}

function FileRow({ entry }: { entry: MintFileEntry }) {
  const isMediaLike = POLITE_SUBTYPES.includes(entry.subdir);
  const isVideoOrAudio = entry.subdir === 'video' || entry.subdir === 'audio' || entry.subdir === 'mpt';
  const previewHref = `${window.location.origin}${entry.publicUrl}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        {isMediaLike ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="block truncate font-medium text-white/90 hover:text-mint-400"
            title="Open in new tab"
          >
            {entry.filename}
          </a>
        ) : (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="block truncate font-medium text-white/90 hover:text-mint-400"
            title="Open"
          >
            {entry.filename}
          </a>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/70">
          <span>{formatBytes(entry.sizeKb)}</span>
          <span aria-hidden>·</span>
          <span>{formatWhen(entry.mtime)}</span>
        </div>
      </div>
      {isVideoOrAudio && entry.subdir === 'audio' && (
        <audio controls preload="none" src={previewHref} className="h-8 max-w-[180px]">
          Your browser does not support audio.
        </audio>
      )}
      {isVideoOrAudio && (entry.subdir === 'video' || entry.subdir === 'mpt') && (
        <video controls preload="none" src={previewHref} className="h-10 max-w-[160px] rounded" />
      )}
    </div>
  );
}

export default function Files() {
  const files = useFiles();
  const config = useFilesConfig();
  const data = files.data;

  const stats = useMemo(() => {
    if (!data) return { total: 0, totalKb: 0 };
    const all = Object.values(data.grouped).flat();
    return { total: all.length, totalKb: all.reduce((s, e) => s + e.sizeKb, 0) };
  }, [data]);

  return (
    <div className="space-y-8 p-6 max-w-5xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every artifact MINT produces — TTS voiceovers, transcripts, video assemblies,
            generated text exports — all in one folder on your machine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => files.refetch()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white/10"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Output root */}
      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-lg font-bold text-white">Output directory</h2>
        {config.data ? (
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-xs">
            <dt className="text-muted-foreground">Configured</dt>
            <dd className="break-all text-white">{config.data.outputDir}</dd>
            <dt className="text-muted-foreground">Resolved</dt>
            <dd className="break-all font-mono text-white">{config.data.resolved}</dd>
            <dt className="text-muted-foreground">Total files</dt>
            <dd className="text-white">
              {stats.total.toLocaleString()} ({formatBytes(stats.totalKb)})
            </dd>
          </dl>
        ) : (
          <Skeleton className="h-16 rounded" />
        )}
        <p className="text-[11px] text-muted-foreground/70">
          Set the <code className="rounded bg-white/5 px-1 font-mono">OUTPUT_BASE_DIR</code> env var (in
          <code className="rounded bg-white/5 px-1 font-mono">backend/.env</code>) to point at a different
          location.
        </p>
      </section>

      {files.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {files.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Error loading files: {String(files.error)}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {Object.entries(data.grouped).map(([subdir, entries]) => {
            const k = subdir as MintSubdir;
            const label = SUBDIR_LABELS[k];
            const desc = SUBDIR_DESCRIPTIONS[k];
            const files = entries as MintFileEntry[];
            return (
              <section key={subdir} className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{label}</h3>
                    <p className="text-[11px] text-muted-foreground/70">{desc}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">
                    {files.length} {files.length === 1 ? 'file' : 'files'}
                  </span>
                </div>
                {files.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4 text-center text-xs text-muted-foreground/60">
                    Nothing here yet — produce a {label.toLowerCase()} from Studio to populate.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((e) => (
                      <FileRow key={`${e.subdir}/${e.filename}`} entry={e} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
