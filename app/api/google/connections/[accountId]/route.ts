import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function DELETE(
  _req: Request,
  { params }: { params: { accountId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Resolve the signed-in user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  // Support either the Account.id *or* providerAccountId in the URL
  const byPk = await prisma.account.findFirst({
    where: { id: params.accountId, userId: user.id }
  });

  const where = byPk
    ? { id: params.accountId }
    : { provider: 'google', providerAccountId: params.accountId, userId: user.id };

  const deleted = await prisma.account.deleteMany({ where });

  // Optional: also clear sessions for a clean slate
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true, deleted: deleted.count });
}