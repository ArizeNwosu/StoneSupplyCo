import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const providers: Provider[] = [
  Resend({
    apiKey: process.env.RESEND_API_KEY ?? 're_placeholder',
    from: process.env.EMAIL_FROM ?? 'noreply@instagramfollowerstracker.com',
  }),
  Credentials({
    name: 'Email & Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (typeof email !== 'string' || typeof password !== 'string') return null;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true, email: true, name: true, password: true },
      });

      if (!user?.password) return null;

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

// Dev-only credentials bypass — never runs in production
if (process.env.NODE_ENV !== 'production') {
  providers.push(
    Credentials({
      id: 'dev-login',
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email || typeof email !== 'string') return null;
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true },
        });
        return user ?? null;
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
  },
});
