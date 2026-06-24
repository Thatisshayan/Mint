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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-mint-950/20 p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <img src="/mint-logo.png" alt="Mint" className="mx-auto h-16 w-16" />
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">Mint</h1>
          <p className="text-sm text-muted-foreground">AI Content Workstation</p>
        </div>
        <div className="mint-card p-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mint-input"
          />
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <button
            type="button"
            disabled={loading || !email.trim()}
            onClick={handleSendLink}
            className="mint-btn w-full uppercase tracking-[0.15em]"
          >
            {loading ? 'Sending...' : 'Launch Mint'}
          </button>
        </div>
      </div>
    </div>
  );
}
