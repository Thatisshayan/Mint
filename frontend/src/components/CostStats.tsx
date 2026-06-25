import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface CostData {
  today: { count: number; cost: number; tokens: number };
  week: { count: number; cost: number; tokens: number };
  total: { count: number; cost: number; tokens: number };
  byProvider: Record<string, { count: number; cost: number; tokens: number }>;
}

export default function CostStats() {
  const { data } = useQuery({
    queryKey: ['cost-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/studio/cost-stats');
      return res.json() as Promise<CostData>;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (!data) return null;

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return `<$0.01`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === 0) return '0';
    if (tokens < 1000) return `${tokens}`;
    return `${(tokens / 1000).toFixed(1)}K`;
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Usage</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground/50">Today</div>
          <div className="text-sm font-bold text-white">{formatCost(data.today.cost)}</div>
          <div className="text-[10px] text-muted-foreground/50">{data.today.count} calls · {formatTokens(data.today.tokens)} tokens</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground/50">This Week</div>
          <div className="text-sm font-bold text-white">{formatCost(data.week.cost)}</div>
          <div className="text-[10px] text-muted-foreground/50">{data.week.count} calls · {formatTokens(data.week.tokens)} tokens</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground/50">Total</div>
          <div className="text-sm font-bold text-white">{formatCost(data.total.cost)}</div>
          <div className="text-[10px] text-muted-foreground/50">{data.total.count} calls · {formatTokens(data.total.tokens)} tokens</div>
        </div>
      </div>
      {Object.keys(data.byProvider).length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.byProvider).map(([provider, stats]) => (
              <div key={provider} className="text-[10px]">
                <span className="font-bold text-muted-foreground">{provider}:</span>{' '}
                <span className="text-muted-foreground/50">{stats.count} calls · {formatCost(stats.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
