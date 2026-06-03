import { signIn } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">Sign in to</h1>
          <p className="text-purple-600 font-semibold">Instagram Followers Tracker</p>
        </div>
        <form
          action={async (formData: FormData) => {
            'use server';
            await signIn('resend', formData);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium py-2 text-sm hover:opacity-90 transition"
          >
            Send magic link
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-400">
          No password needed. We&apos;ll email you a sign-in link.
        </p>
      </div>
    </main>
  );
}
