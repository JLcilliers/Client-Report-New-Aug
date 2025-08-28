import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // never cache mutations

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

  // Delete by PK, scoped to this user & provider
  const out = await prisma.account.deleteMany({
    where: { id: params.accountId, userId: user.id, provider: 'google' },
  });

  return NextResponse.json({ ok: true, deleted: out.count });
}