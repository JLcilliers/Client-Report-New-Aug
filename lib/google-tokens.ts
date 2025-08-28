import prisma from '@/lib/prisma';

export async function getAccessTokenForAccount(accountId: string, userId: string) {
  const acct = await prisma.account.findFirst({
    where: { id: accountId, userId, provider: 'google' },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true, scope: true },
  });
  if (!acct) throw new Error('account_not_found');

  const now = Math.floor(Date.now() / 1000);
  if (acct.access_token && acct.expires_at && acct.expires_at > now + 60) {
    return acct.access_token;
  }
  if (!acct.refresh_token) throw new Error('no_refresh_token');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    grant_type: 'refresh_token',
    refresh_token: acct.refresh_token,
  });

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    throw new Error(`refresh_failed:${data.error ?? resp.status}`);
  }

  const newAccess = data.access_token as string;
  const expiresIn = (data.expires_in as number | undefined) ?? 0;
  const newExpires = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;

  await prisma.account.update({
    where: { id: accountId },
    data: { access_token: newAccess, expires_at: newExpires ?? undefined, scope: data.scope ?? acct.scope },
  });

  return newAccess;
}