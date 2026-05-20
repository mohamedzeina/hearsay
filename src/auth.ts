import NextAuth, { type DefaultSession } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const playwrightTest = process.env.PLAYWRIGHT_TEST === '1';

if (!playwrightTest && (!githubClientId || !githubClientSecret)) {
  throw new Error(
    'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variable.'
  );
}

const providers = playwrightTest
  ? [
      // E2E-only: signs in by email. Looks up or creates a User row.
      // Never enabled outside PLAYWRIGHT_TEST=1.
      Credentials({
        name: 'TestCredentials',
        credentials: { email: { label: 'Email', type: 'email' } },
        async authorize(credentials) {
          const email = credentials?.email;
          if (typeof email !== 'string' || !email.includes('@')) return null;
          const user =
            (await db.user.findUnique({ where: { email } })) ??
            (await db.user.create({
              data: { email, name: email.split('@')[0] },
            }));
          return { id: user.id, email: user.email, name: user.name };
        },
      }),
    ]
  : [
      GitHub({
        clientId: githubClientId!,
        clientSecret: githubClientSecret!,
        profile(profile) {
          const name = profile.name?.trim() || profile.login?.trim() || null;
          return {
            id: profile.id.toString(),
            name,
            email: profile.email?.trim() || null,
            image: profile.avatar_url,
          };
        },
      }),
    ];

export const {
  handlers: { GET, POST },
  auth,
  signOut,
  signIn,
} = NextAuth({
  adapter: PrismaAdapter(db),
  // Credentials provider requires JWT sessions; DB sessions need OAuth.
  session: { strategy: playwrightTest ? 'jwt' : 'database' },
  providers,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    // Under JWT strategy, NextAuth passes `token` (not `user`); under DB
    // strategy it passes `user`. Read whichever is present.
    session({ session, user, token }) {
      if (session.user) {
        if (user) session.user.id = user.id;
        else if (token?.sub) session.user.id = token.sub;
      }
      return session;
    },
  },
});
