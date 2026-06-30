import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/context/toastContext';

interface OllamaModel {
  name: string;
  size: number;
  family?: string;
  parameter_size?: string;
  quantization_level?: string;
}

interface ServiceStatus {
  name: string;
  url: string | null;
  reachable: boolean;
  detail?: string;
}

interface SettingsResponse {
  services: ServiceStatus[];
  ollama: {
    reachable: boolean;
    baseUrl: string;
    models: OllamaModel[];
    selectedModel: string | null;
    error?: string;
  };
  db: { userCount: number };
  aiProvider: string;
  jwtSecretConfigured: boolean;
  devMode: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function Settings() {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [pendingModel, setPendingModel] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/services');
      return res.json() as Promise<SettingsResponse>;
    },
  });

  const setModel = useMutation({
    mutationFn: async (model: string | null) => {
      const res = await apiClient.post('/settings/ollama-model', { model });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      addToast(
        data.selected
          ? `Model switched to ${data.selected}`
          : 'Reverted to auto-pick',
        'success',
      );
    },
    onError: (err) => addToast(`Failed: ${(err as Error).message}`, 'error'),
  });

  const runMigrations = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/settings/run-migrations', {});
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      addToast(
        data.tablesPresent
          ? `DB OK (${data.counts.users} user${data.counts.users === 1 ? '' : 's'})`
          : 'DB not ready',
        data.tablesPresent ? 'success' : 'warning',
      );
    },
  });

  // Sync local picker when the selected model arrives from the backend.
  useEffect(() => {
    if (data && pendingModel === null) {
      setPendingModel(data.ollama.selectedModel);
    }
  }, [data, pendingModel]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const servicesByKey = Object.fromEntries(data.services.map((s) => [s.name, s]));

  return (
    <div className="space-y-8 p-6 max-w-5xl">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            Mode: {data.devMode ? 'dev' : 'prod'}
          </span>
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            AI: {data.aiProvider}
          </span>
        </div>
      </header>

      {/* Model picker */}
      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Ollama model</h2>
            <p className="text-xs text-muted-foreground">
              {data.ollama.reachable
                ? `Reachable at ${data.ollama.baseUrl} — ${data.ollama.models.length} model(s) installed.`
                : `Cannot reach ${data.ollama.baseUrl}. Start Ollama and refresh.`}
            </p>
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['settings'] })}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {data.ollama.error && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-300">
            {data.ollama.error}
          </div>
        )}

        {data.ollama.models.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.ollama.models.map((m) => {
              const selected = pendingModel === m.name;
              return (
                <button
                  key={m.name}
                  onClick={() => setPendingModel(m.name)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? 'border-mint-500 bg-mint-500/10 text-mint-300'
                      : 'border-white/10 bg-white/[0.03] text-white/90 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {m.parameter_size || formatBytes(m.size)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <button
            onClick={() => {
              setModel.mutate(null);
              setPendingModel(null);
            }}
            disabled={setModel.isPending || pendingModel === null}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white/10 disabled:opacity-40"
          >
            Auto-pick
          </button>
          <button
            onClick={() =>
              setModel.mutate(
                pendingModel && data.ollama.models.some((m) => m.name === pendingModel)
                  ? pendingModel
                  : null,
              )
            }
            disabled={setModel.isPending}
            className="rounded-full bg-mint-500 px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-mint-950 hover:brightness-110 disabled:opacity-60"
          >
            {setModel.isPending ? 'Saving…' : 'Save selection'}
          </button>
        </div>
      </section>

      {/* Service health */}
      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-lg font-bold text-white">Local services</h2>
        <p className="text-xs text-muted-foreground">
          Status of each integrated service. Reachable means the backend answered a health check.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.services.map((s) => (
            <a
              key={s.name}
              href={s.url ?? undefined}
              target={s.url?.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{s.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    s.reachable
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {s.reachable ? 'reachable' : 'unreachable'}
                </span>
              </div>
              {s.url && (
                <div className="mt-1 truncate text-[11px] text-muted-foreground/80">{s.url}</div>
              )}
              {s.detail && (
                <div className="mt-1 text-[11px] text-muted-foreground">{s.detail}</div>
              )}
            </a>
          ))}
        </div>
      </section>

      {/* DB test */}
      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-lg font-bold text-white">Database</h2>
        <p className="text-xs text-muted-foreground">
          {data.db.userCount} user row(s) in the DB. The auto-provisioning middleware creates one on
          first login.
        </p>
        <div className="flex items-center justify-end">
          <button
            onClick={() => runMigrations.mutate()}
            disabled={runMigrations.isPending}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white/10 disabled:opacity-40"
          >
            {runMigrations.isPending ? 'Checking…' : 'Run schema check'}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-lg font-bold text-white">Configuration</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-xs">
          <dt className="text-muted-foreground">JWT secret</dt>
          <dd className="text-white">
            {data.jwtSecretConfigured ? 'configured (env)' : 'using dev fallback'}
          </dd>
          <dt className="text-muted-foreground">Mode</dt>
          <dd className="text-white">{data.devMode ? 'development' : 'production'}</dd>
          <dt className="text-muted-foreground">Provider</dt>
          <dd className="text-white">{data.aiProvider}</dd>
          {servicesByKey.ollama && (
            <>
              <dt className="text-muted-foreground">Ollama URL</dt>
              <dd className="break-all text-white">{servicesByKey.ollama.url}</dd>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}
