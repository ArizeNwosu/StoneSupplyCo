import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false },
};

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-4xl mb-4">📬</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-500 text-sm">
          We sent a magic link to your inbox. Click it to sign in — no password needed.
        </p>
      </div>
    </main>
  );
}
