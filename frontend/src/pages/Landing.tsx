import { useState } from 'react';
import { authApi } from '@/lib/api/auth';

export default function Landing() {
  const [email, setEmail] = useState('demo@example.com');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendLink = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.signInWithMagicLink(email);
      setSent(true);
      // Dev-only: auto-verify with a dummy token since no real SMTP
      await authApi.verifyMagicLink('dev-token', email);
      window.location.href = '/app';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h1 className="text-2xl font-black uppercase text-white">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            A magic link was sent to <span className="text-mint-400">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black uppercase text-white">Mint</h1>
          <p className="text-sm text-muted-foreground">AI Content Workstation</p>
        </div>
        <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-muted-foreground focus:border-mint-400 focus:outline-none"
          />
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <button
            type="button"
            disabled={loading || !email.trim()}
            onClick={handleSendLink}
            className="h-12 w-full rounded-2xl bg-mint-500 px-6 font-black uppercase tracking-[0.2em] text-mint-950 shadow-[0_20px_40px_rgba(13,148,136,.35)] hover:brightness-110 disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Launch Mint'}
          </button>
        </div>
      </div>
    </div>
  );
}
