import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function DELETE(
  _req: Request,
  { params }: { params: { accountId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'user_not_found' }, { status: 404 });

  // Delete by primary key for this user
  const result = await prisma.account.deleteMany({
    where: { id: params.accountId, userId: user.id, provider: 'google' },
  });

  // optional: clear sessions so the UI forces a fresh read
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ ok: true, deleted: result.count });
}