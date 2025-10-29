// lib/auth-options-simple.ts
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptionsSimple: NextAuthOptions = {
  // No adapter - use JWT strategy
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-testing',
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error',
  },
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
  debug: true,
  callbacks: {
    async jwt({ token, account, user }) {
      // Save Google tokens in JWT
      if (account?.provider === 'google') {
        token.google = {
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: (account.expires_at ?? 0) * 1000,
          scope: account.scope
        };
        token.userId = user?.id;
        token.email = user?.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Add Google tokens to session
      (session as any).google = token.google ?? null;
      if (session?.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      
      
      
      return true;
    },
  },
};