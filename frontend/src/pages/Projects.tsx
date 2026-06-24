import { useState, type FormEvent } from 'react';
import { useCreateProject, useProjects } from '@/stores/projects';

type Project = {
  id: string;
  title: string;
  description?: string | null;
};

export default function Projects() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { data: projects, isLoading } = useProjects();
  const create = useCreateProject();

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    await create.mutateAsync({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-black uppercase text-foreground">Projects</h1>
      <form onSubmit={handleCreate} className="mt-8 mint-card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mint-input mt-2"
            placeholder="My content engine"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mint-input mt-2 min-h-[100px] resize-none py-3"
            placeholder="What are we building?"
          />
        </div>
        <button
          type="submit"
          disabled={create.isPending}
          className="mint-btn"
        >
          Create project
        </button>
      </form>

      <div className="mt-10 grid gap-4">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {(projects ?? []).map((project: Project) => (
          <div key={project.id} className="mint-card p-5">
            <div className="text-base font-bold text-foreground">{project.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{project.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
