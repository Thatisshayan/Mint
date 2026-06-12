import { useState } from 'react';
import { useCreateProject } from '@/stores/projects';

export default function Projects() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { data: projects, isLoading } = useProjects();
  const create = useCreateProject();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ name, description });
    setName('');
    setDescription('');
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-black uppercase text-white">Projects</h1>
      <form onSubmit={handleCreate} className="mt-8 space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
            placeholder="My content engine"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
            placeholder="What are we building?"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-2xl bg-mint-500 px-6 font-black uppercase tracking-[0.2em] text-mint-950 shadow-[0_20px_40px_rgba(13,148,136,.35)] hover:brightness-110 disabled:opacity-60"
        >
          Create project
        </button>
      </form>

      <div className="mt-10 grid gap-4">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {(projects ?? []).map((project: any) => (
          <div key={project.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-base font-bold text-white">{project.name}</div>
            <div className="text-sm text-muted-foreground">{project.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
