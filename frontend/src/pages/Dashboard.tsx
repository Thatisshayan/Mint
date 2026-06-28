import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';
import { downloadAsJSON } from '@/lib/export';
import { useToast } from '@/context/toastContext';

interface DashboardStats {
  totalContent: number;
  thisWeek: number;
  thisMonth: number;
  favorites: number;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
  recentItems: Array<{
    id: string;
    content: string;
    platform: string;
    status: string;
    createdAt: string;
  }>;
  aiStats: {
    today: { count: number; cost: number };
    week: { count: number; cost: number };
    total: { count: number; cost: number };
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleExport = async () => {
    try {
      const res = await apiClient.get('/export/all');
      const data = await res.json();
      downloadAsJSON(data, `mint-backup-${new Date().toISOString().split('T')[0]}.json`);
      addToast('Data exported successfully', 'success');
    } catch {
      addToast('Failed to export data', 'error');
    }
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [libRes, costRes] = await Promise.all([
        apiClient.get('/library'),
        apiClient.get('/studio/cost-stats'),
      ]);
      const libData = await libRes.json();
      const costData = await costRes.json();
      const items = libData.items || [];

      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const byPlatform: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let favorites = 0;
      let thisWeek = 0;
      let thisMonth = 0;

      for (const item of items) {
        byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        if (item.isFavorite) favorites++;
        const created = new Date(item.createdAt);
        if (created >= weekAgo) thisWeek++;
        if (created >= monthAgo) thisMonth++;
      }

      return {
        totalContent: items.length,
        thisWeek,
        thisMonth,
        favorites,
        byPlatform,
        byStatus,
        recentItems: items.slice(0, 5),
        aiStats: costData,
      } as DashboardStats;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.02]" />
          ))}
        </div>
      </div>
    );
  }

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={() => navigate('/app/studio')}
          className="rounded-xl bg-mint-500 px-4 py-2 text-sm font-bold text-mint-950 hover:brightness-110"
        >
          + Generate Content
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Content</div>
          <div className="mt-2 text-3xl font-black text-white">{stats?.totalContent || 0}</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">This Week</div>
          <div className="mt-2 text-3xl font-black text-white">{stats?.thisWeek || 0}</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Favorites</div>
          <div className="mt-2 text-3xl font-black text-yellow-400">{stats?.favorites || 0}</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Cost (Today)</div>
          <div className="mt-2 text-3xl font-black text-white">{formatCost(stats?.aiStats?.today?.cost || 0)}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-sm font-bold text-white">Recent Activity</h2>
          {stats?.recentItems && stats.recentItems.length > 0 ? (
            <div className="space-y-2">
              {stats.recentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2">
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    {item.platform}
                  </span>
                  <p className="flex-1 truncate text-xs text-white/70">{item.content}</p>
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No content yet</p>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <h2 className="mb-3 text-sm font-bold text-white">By Platform</h2>
          {stats?.byPlatform && Object.keys(stats.byPlatform).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.byPlatform)
                .sort(([, a], [, b]) => b - a)
                .map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{platform}</span>
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <h2 className="mb-3 text-sm font-bold text-white">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <button
            onClick={() => navigate('/app/studio')}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50"
          >
            Generate Content
          </button>
          <button
            onClick={() => navigate('/app/library')}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50"
          >
            View Library
          </button>
          <button
            onClick={() => navigate('/app/publish')}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50"
          >
            Publish Queue
          </button>
          <button
            onClick={() => navigate('/app/research')}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50"
          >
            Research
          </button>
          <button
            onClick={handleExport}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left text-sm font-bold text-white hover:border-mint-400/50"
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}
