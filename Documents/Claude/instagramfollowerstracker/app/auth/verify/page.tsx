import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false },
};

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-cyan-950/10 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">📬</div>
        <h1 className="mb-2 text-xl font-bold text-slate-950">Check your email</h1>
        <p className="text-sm text-slate-600">
          We sent a magic link to your inbox. Click it to sign in — no password needed.
        </p>
      </div>
    </main>
  );
}
