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

  // Check if this is a google_tokens ID (new flow) or Account ID (legacy)
  // Try google_tokens first
  let deleted = await prisma.googleTokens.deleteMany({ 
    where: { id: params.accountId, userId: user.id } 
  });
  
  // If no google_tokens deleted, try legacy Account table
  if (deleted.count === 0) {
    deleted = await prisma.account.deleteMany({
      where: { id: params.accountId, userId: user.id, provider: 'google' },
    });
  }

  return NextResponse.json({ ok: true, deleted: deleted.count });
}