// lib/auth-options.ts
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  session: { strategy: 'database' },           // Use database strategy with adapter
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
    async session({ session, user }) {
      // With database strategy, we get the user from the database
      if (session?.user) {
        session.user.id = user.id;
        
        // Fetch Google tokens from the Account table
        const googleAccount = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: 'google'
          }
        });
        
        if (googleAccount) {
          // Add Google tokens to session
          (session as any).google = {
            access_token: googleAccount.access_token,
            refresh_token: googleAccount.refresh_token,
            expires_at: googleAccount.expires_at ? googleAccount.expires_at * 1000 : null
          };
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('=== SIGN IN ATTEMPT ===');
      console.log('User:', user);
      console.log('Account:', account);
      console.log('Profile:', profile);
      
      // Just allow the sign in - the PrismaAdapter will handle saving the account
      // We'll copy tokens to GoogleTokens table after user is created
      return true;
    },
  },
};
