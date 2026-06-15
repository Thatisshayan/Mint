import { authApi } from '@/lib/api/auth';

export default function Landing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <button
        type="button"
        onClick={() => authApi.signInWithMagicLink('demo@example.com')}
        className="rounded-2xl bg-mint-500 px-6 py-3 font-black uppercase tracking-widest text-mint-950"
      >
        Launch Mint
      </button>
    </div>
  );
}
