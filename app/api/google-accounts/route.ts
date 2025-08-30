import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.googleAccount.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        scope: true
      }
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching Google accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, refreshToken, email, scope } = body;

    const account = await prisma.googleAccount.create({
      data: {
        userId: session.user.id,
        email,
        accessToken,
        refreshToken,
        scope: scope || 'https://www.googleapis.com/auth/analytics.readonly'
      }
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error saving Google account:', error);
    return NextResponse.json({ error: 'Failed to save account' }, { status: 500 });
  }
}