// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
// Temporarily use simple auth to debug the issue
import { authOptionsSimple } from '@/lib/auth-options-simple';
// import { authOptions } from '@/lib/auth-options';

const handler = NextAuth(authOptionsSimple);

export { handler as GET, handler as POST };