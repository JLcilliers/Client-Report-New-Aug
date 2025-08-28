// lib/auth-options.ts
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),              // pass the PrismaClient instance
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent select_account',
          access_type: 'offline',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly',
          ].join(' ')
        }
      }
    }),
  ],
  debug: true,
  logger: {
    error(code, metadata) {
      console.error('Auth error:', code, metadata);
    },
    warn(code) {
      console.warn('Auth warning:', code);
    },
    debug(code, metadata) {
      console.debug('Auth debug:', code, metadata);
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === 'google') {
        token.google = {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: (account.expires_at ?? 0) * 1000
        };
      }
      const g = token.google as any;
      if (g?.expires_at && Date.now() > g.expires_at && g.refresh_token) {
        const body = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: g.refresh_token,
        }).toString();
        const r = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body
        });
        const data = await r.json();
        if (data.access_token) {
          g.access_token = data.access_token;
          g.expires_at = Date.now() + data.expires_in * 1000;
        }
        token.google = g;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).google = token.google ?? null;
      console.log('Session callback:', { session: session.user?.email });
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', { user, account: account?.provider });
      return true;
    },
  },
};