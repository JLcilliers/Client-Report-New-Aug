// lib/auth-options.ts
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

// redact secrets recursively in any metadata payload
const REDACT = /(token|id_token|access_token|refresh_token|client_secret|code)$/i;
function sanitizeMeta(...meta: unknown[]): Record<string, unknown> {
  try {
    const merged = meta.length === 1 ? meta[0] : meta;
    const safe = JSON.parse(JSON.stringify(merged, (k, v) => (
      typeof k === 'string' && REDACT.test(k) ? '[redacted]' : v
    )));
    return { meta: safe };
  } catch {
    return { meta: '[unserializable]' };
  }
}

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
          include_granted_scopes: 'true',
          scope: [
            'openid','email','profile',
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/webmasters.readonly'
          ].join(' ')
        }
      }
    }),
  ],
  debug: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true',
  logger: {
    error(code, ...metadata) {
      Sentry.captureMessage(`nextauth:error:${code}`, {
        level: 'error',
        extra: sanitizeMeta(...metadata),
      });
    },
    warn(code, ...metadata) {
      Sentry.captureMessage(`nextauth:warn:${code}`, {
        level: 'warning',
        extra: sanitizeMeta(...metadata),
      });
    },
    debug(code, ...metadata) {
      if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
        Sentry.captureMessage(`nextauth:debug:${code}`, {
          level: 'info',
          extra: sanitizeMeta(...metadata),
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'google') {
        token.google = {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: (account.expires_at ?? 0) * 1000
        };
        token.userId = user?.id;
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
      if (session?.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Save or update Google account details
          await prisma.googleAccount.upsert({
            where: {
              email: user.email!
            },
            update: {
              accessToken: account.access_token!,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
            },
            create: {
              userId: user.id,
              email: user.email!,
              accessToken: account.access_token!,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
              scope: account.scope || ''
            }
          });
        } catch (error) {
          console.error('Error saving Google account:', error);
          Sentry.captureException(error);
          return false; // Prevent sign in on error
        }
      }
      return true;
    },
  },
};