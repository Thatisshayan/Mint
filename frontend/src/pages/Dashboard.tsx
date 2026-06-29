import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';
import { downloadAsJSON } from '@/lib/export';
import { useToast } from '@/context/toastContext';
import { motion, type Variants, type Easing } from 'framer-motion';

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

const EASE: Easing = [0.25, 0.46, 0.45, 0.94] as unknown as Easing;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, delay: i * 0.05, ease: EASE },
  }),
};

const listItem: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, delay: i * 0.04, ease: EASE },
  }),
};

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
        recentItems: items.slice(0, 6),
        aiStats: costData,
      } as DashboardStats;
    },
  });

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(2)}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-0 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="flex border-y border-border/60">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 border-r border-border/60 p-4 last:border-r-0">
              <div className="mb-2 h-2.5 w-20 animate-pulse rounded bg-muted" />
              <div className="h-6 w-12 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statTotal = Object.values(stats?.byPlatform ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-between px-6 pb-4 pt-6"
      >
        <div>
          <p className="label-caps mb-1">{dateLabel}</p>
          <h1 className="text-[17px] font-bold tracking-tight text-foreground">{greeting}</h1>
        </div>
        <button
          onClick={() => navigate('/app/studio')}
          className="mint-btn rounded-full text-xs"
        >
          + Generate
        </button>
      </motion.div>

      {/* Stats strip — horizontal, no boxes, just dividers */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex border-y border-border/60 mx-6"
      >
        {[
          { label: 'Total Content', value: stats?.totalContent ?? 0, accent: false },
          { label: 'This Week', value: stats?.thisWeek ?? 0, accent: false },
          { label: 'Favorites', value: stats?.favorites ?? 0, accent: true },
          { label: 'AI Cost Today', value: formatCost(stats?.aiStats?.today?.cost ?? 0), accent: false },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`flex-1 px-4 py-3 ${i < 3 ? 'border-r border-border/60' : ''}`}
          >
            <p className="label-caps mb-1.5">{stat.label}</p>
            <p
              className={`text-[22px] font-bold tabular-nums leading-none tracking-tight ${
                stat.accent ? 'text-primary' : 'text-foreground'
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </motion.div>

      <div className="flex flex-col gap-6 px-6 py-5">
        {/* Quick actions — pill buttons */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/app/studio')} className="mint-btn text-xs rounded-full">
            Generate
          </button>
          {[
            { label: 'Library', to: '/app/library' },
            { label: 'Publish Queue', to: '/app/publish' },
            { label: 'Research', to: '/app/research' },
          ].map((a) => (
            <button
              key={a.to}
              onClick={() => navigate(a.to)}
              className="mint-btn-ghost text-xs rounded-full"
            >
              {a.label}
            </button>
          ))}
          <button onClick={handleExport} className="mint-btn-ghost text-xs rounded-full">
            Export
          </button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-[1fr_220px]">
          {/* Recent activity — borderless rows */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <p className="label-caps mb-3">Recent Activity</p>
            {stats?.recentItems && stats.recentItems.length > 0 ? (
              <div className="flex flex-col">
                {stats.recentItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    custom={i}
                    variants={listItem}
                    initial="hidden"
                    animate="visible"
                    className={`flex items-center gap-3 py-2.5 ${
                      i < stats.recentItems.length - 1 ? 'border-b border-border/40' : ''
                    }`}
                  >
                    <span className="platform-tag shrink-0">{item.platform}</span>
                    <p className="flex-1 truncate text-[12px] text-foreground/80">{item.content}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground/60">
                      {formatDate(item.createdAt)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">No content yet — generate something.</p>
            )}
          </motion.div>

          {/* Platform breakdown — minimal */}
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <p className="label-caps mb-3">By Platform</p>
            {stats?.byPlatform && Object.keys(stats.byPlatform).length > 0 ? (
              <div className="flex flex-col gap-3">
                {Object.entries(stats.byPlatform)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => {
                    const pct = statTotal > 0 ? Math.round((count / statTotal) * 100) : 0;
                    return (
                      <div key={platform}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{platform}</span>
                          <span className="text-[11px] tabular-nums text-foreground/70">{count}</span>
                        </div>
                        <div className="h-[2px] w-full overflow-hidden rounded-full bg-border/50">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">No data yet.</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
