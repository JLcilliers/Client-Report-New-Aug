import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        accounts: [] 
      }, { status: 401 });
    }

    const accounts = await prisma.googleAccount.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        scope: true,
        expiresAt: true
      }
    });

    return NextResponse.json({ 
      accounts,
      count: accounts.length 
    });
  } catch (error) {
    console.error('Error fetching Google accounts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch accounts',
      accounts: [] 
    }, { status: 500 });
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

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    await prisma.googleAccount.delete({
      where: {
        id: accountId,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Google account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}