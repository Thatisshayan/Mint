import { useState, type FormEvent } from 'react';
import { useCreateProject, useProjects } from '@/stores/projects';
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion';

type Project = {
  id: string;
  title: string;
  description?: string | null;
};

const EASE: Easing = [0.25, 0.46, 0.45, 0.94] as unknown as Easing;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, delay: i * 0.04, ease: EASE },
  }),
};

export default function Projects() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data: projects, isLoading } = useProjects();
  const create = useCreateProject();

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    await create.mutateAsync({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between px-6 pb-4 pt-6"
      >
        <div>
          <p className="label-caps mb-1">Workspace</p>
          <h1 className="text-[17px] font-bold tracking-tight text-foreground">Projects</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="mint-btn rounded-full text-xs"
        >
          {showForm ? '✕ Cancel' : '+ New Project'}
        </button>
      </motion.div>

      {/* New project form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden border-y border-border/60 bg-card/40"
          >
            <form onSubmit={handleCreate} className="flex flex-col gap-4 px-6 py-5">
              <p className="label-caps">New project</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-caps mb-1.5 block">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mint-input"
                    placeholder="My content engine"
                  />
                </div>
                <div>
                  <label className="label-caps mb-1.5 block">Description</label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mint-input"
                    placeholder="What are we building?"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={create.isPending} className="mint-btn rounded-full text-xs">
                  {create.isPending ? 'Creating…' : 'Create project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="mint-btn-ghost rounded-full text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project list — borderless rows */}
      <div className="px-6 py-4">
        {isLoading && (
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-64 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && (projects ?? []).length === 0 && (
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="pt-4 text-[12px] text-muted-foreground"
          >
            No projects yet — create one above.
          </motion.div>
        )}

        {!isLoading && (projects ?? []).length > 0 && (
          <div className="flex flex-col">
            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="label-caps mb-3"
            >
              {(projects ?? []).length} project{(projects ?? []).length !== 1 ? 's' : ''}
            </motion.p>
            {(projects ?? []).map((project: Project, i: number) => (
              <motion.div
                key={project.id}
                custom={i + 2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className={`flex items-start gap-3 py-3 ${
                  i < (projects ?? []).length - 1 ? 'border-b border-border/40' : ''
                }`}
              >
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{project.title}</p>
                  {project.description && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70 line-clamp-1">
                      {project.description}
                    </p>
                  )}
                </div>
                <span className="platform-tag mt-0.5 shrink-0">Active</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
