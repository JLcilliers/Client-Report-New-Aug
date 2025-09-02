// app/api/google/debug-token/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  const g = (session as any)?.google;
  if (!g?.access_token) return new Response('no token', { status: 401 });

  const info = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${g.access_token}`
  ).then(r => r.json()).catch(() => ({}));

  return Response.json({
    has_token: !!g.access_token,
    expires_in_ms: g.expires_at ? g.expires_at - Date.now() : null,
    tokeninfo: info, // includes scope string
  });
}