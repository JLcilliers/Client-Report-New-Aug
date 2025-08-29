import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // no caching of mutations

export async function DELETE(
  _req: Request,
  { params }: { params: { accountId: string } }
) {
  const requestId = crypto.randomUUID();
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  log.info({ source: 'api/google/connections/[id]#DELETE', requestId,
             userId: user.id, accountId: params.accountId, message: 'Delete requested' });

  try {
    // Delete THIS user's Google account by PK
    const result = await prisma.account.deleteMany({
      where: { id: params.accountId, userId: user.id, provider: 'google' },
    });

    // Optional: clear sessions for a clean UI reload
    await prisma.session.deleteMany({ where: { userId: user.id } });

    log.info({ source: 'api/google/connections/[id]#DELETE', requestId,
               userId: user.id, accountId: params.accountId, message: 'Delete ok' });

    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (e: any) {
    log.error({ source: 'api/google/connections/[id]#DELETE', requestId,
                userId: user.id, accountId: params.accountId, message: e.message, meta: { stack: e.stack } });
    throw e;
  }
}