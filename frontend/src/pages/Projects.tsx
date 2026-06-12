import { useProjects } from '@/stores/useProjectsStore';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading projects…</div>;
  if (!projects || projects.length === 0)
    return <div className="p-10 text-muted-foreground">No projects yet. Create one from the dashboard.</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-black tracking-tight uppercase text-white">Projects</h1>
      <ul className="space-y-3">
        {projects.map((project: any) => (
          <li key={project.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <div className="text-base font-bold text-white">{project.name}</div>
            <div className="text-sm text-muted-foreground">{project.description}</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-mint-300">{project.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
