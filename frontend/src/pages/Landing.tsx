import { signInWithMagicLink } from '@/lib/api/auth';
import { useState, type FormEvent } from 'react';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithMagicLink(email);
      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-mint-400 shadow-[0_0_12px_rgba(45,212,191,.45)]" />
            <span className="text-xs font-bold uppercase tracking-[0.35em] text-muted-foreground">Mint</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight uppercase text-white sm:text-7xl">
            Create at the speed of light
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A premium content engine for creators and teams. Research, generate, organize, and publish—all in one
            workspace.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-md space-y-4 rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8">
          {submitted ? (
            <p className="text-center text-sm text-muted-foreground">Check your inbox for a sign-in link.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-2xl bg-mint-500 font-black uppercase tracking-[0.2em] text-mint-950 shadow-[0_20px_40px_rgba(13,148,136,.35)] hover:brightness-110 disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Get early access'}
              </button>
              {error && <p className="text-center text-sm text-red-400">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
