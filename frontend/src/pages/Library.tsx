import { useState } from 'react';
import { useLibrary, useDeleteLibraryItem, useUpdateLibraryItem } from '@/stores/library';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const STATUS_FILTER = ['all', 'draft', 'published', 'archived'] as const;

export default function Library() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { data, isLoading, error } = useLibrary();
  const deleteMutation = useDeleteLibraryItem();
  const updateMutation = useUpdateLibraryItem();

  const filtered =
    filter === 'all'
      ? data
      : data?.filter((item: any) => item.status === filter);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, updates: { status } });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Library</h1>
        <div className="flex gap-2">
          {STATUS_FILTER.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                filter === s
                  ? 'bg-mint-500/20 text-mint-500'
                  : 'bg-white/[0.05] text-muted-foreground hover:bg-white/[0.08]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          Error loading library: {String(error)}
        </div>
      )}

      {!isLoading && !error && filtered?.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
          <p className="text-muted-foreground">No saved content yet.</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Generate something in the Studio!</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered?.map((item: any) => (
          <div
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-white/90">{item.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.platform}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'published'
                        ? 'bg-green-500/10 text-green-400'
                        : item.status === 'archived'
                          ? 'bg-gray-500/10 text-gray-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {item.status !== 'archived' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(item.id, 'archived');
                    }}
                    className="rounded-lg bg-white/[0.05] px-2 py-1 text-xs text-muted-foreground hover:bg-white/[0.08] hover:text-white"
                  >
                    Archive
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Content Detail</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg bg-white/[0.05] px-3 py-1 text-xs text-muted-foreground hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                  {selectedItem.content}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Platform: {selectedItem.platform}
                </span>
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Status: {selectedItem.status}
                </span>
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Created: {new Date(selectedItem.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedItem.content);
                  }}
                  className="bg-white/10 hover:bg-white/20"
                >
                  Copy to Clipboard
                </Button>
                <Button
                  onClick={() => {
                    handleDelete(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
