import { useAIStatus } from '@/stores/studio';

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  ollama: 'Ollama',
  placeholder: 'Offline',
};

const PROVIDER_COLORS: Record<string, string> = {
  deepseek: 'bg-green-500',
  openai: 'bg-blue-500',
  ollama: 'bg-purple-500',
  placeholder: 'bg-gray-500',
};

export default function AIStatusBadge() {
  const { data, isLoading } = useAIStatus();

  if (isLoading || !data) return null;

  const provider = data.activeProvider || 'placeholder';
  const label = PROVIDER_LABELS[provider] || provider;
  const dotColor = PROVIDER_COLORS[provider] || 'bg-gray-500';

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5">
      <div className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        AI: {label}
      </span>
    </div>
  );
}
