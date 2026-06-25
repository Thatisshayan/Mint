import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePublishQueue, usePublishItem, useDeletePublishItem } from '@/stores/publish';
import { exportQueueAsJSON } from '@/lib/export';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  published: 'Published',
};

const STATUS_COLOR: Record<string, string> = {
  pending_review: 'bg-yellow-500/10 text-yellow-400',
  approved: 'bg-green-500/10 text-green-400',
  published: 'bg-blue-500/10 text-blue-400',
};

export default function Publish() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data, isLoading, error } = usePublishQueue();
  const publishMutation = usePublishItem();
  const deleteMutation = useDeletePublishItem();

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const handleRemove = (id: string) => {
    if (window.confirm('Remove from queue?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Publish Queue</h1>
        <div className="flex items-center gap-3">
          {data && data.length > 0 && (
            <button
              onClick={() => exportQueueAsJSON(data)}
              className="rounded-full border border-white/5 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-white/[0.08]"
            >
              Export JSON
            </button>
          )}
          <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-muted-foreground">
            {data?.length || 0} items
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          Error loading queue: {String(error)}
        </div>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
          <p className="text-muted-foreground">Your publish queue is empty.</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Save content from the Studio to add it here.
          </p>
        </div>
      )}

      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {data?.map((item: any) => (
          <motion.div
            key={item.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-sm text-white/90">{item.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.platform}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_COLOR[item.status] || 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {STATUS_LABEL[item.status] || item.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {item.status !== 'published' && (
                  <button
                    onClick={() => handlePublish(item.id)}
                    disabled={publishMutation.isPending}
                    className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                  >
                    Publish Now
                  </button>
                )}
                <button
                  onClick={() => handleCopy(item.content, item.id)}
                  className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white/[0.08] hover:text-white"
                >
                  {copiedId === item.id ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
