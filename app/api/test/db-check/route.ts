import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  
  
  const results = {
    queryAll: { success: false, message: '', data: null as any },
    create: { success: false, message: '', data: null as any },
    delete: { success: false, message: '' },
    prismaStatus: { success: false, message: '' }
  };

  try {
    // Test 1: Check Prisma connection
    
    try {
      await prisma.$connect();
      results.prismaStatus.success = true;
      results.prismaStatus.message = 'Prisma connected successfully';
      
    } catch (error: any) {
      results.prismaStatus.message = `Connection failed: ${error.message}`;
      
    }

    // Test 2: Query all Account records
    
    try {
      const accounts = await prisma.account.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
      
      results.queryAll.success = true;
      results.queryAll.message = `Found ${accounts.length} accounts`;
      results.queryAll.data = accounts.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        providerAccountId: acc.providerAccountId,
        userEmail: acc.user?.email,
        hasRefreshToken: !!acc.refresh_token,
        expiresAt: acc.expires_at
      }));
      
      
      accounts.forEach((acc, index) => {
      });
    } catch (error: any) {
      results.queryAll.message = `Query failed: ${error.message}`;
      
    }

    // Test 3: Create a test Account record
    
    const testEmail = `test-${Date.now()}@example.com`;
    let createdAccountId: string | null = null;
    
    try {
      // First create a test user
      
      const testUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User'
        }
      });
      

      // Then create the account
      
      const testAccount = await prisma.account.create({
        data: {
          userId: testUser.id,
          type: 'oauth',
          provider: 'test-provider',
          providerAccountId: testEmail,
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          scope: 'test-scope'
        }
      });
      
      createdAccountId = testAccount.id;
      results.create.success = true;
      results.create.message = 'Test account created successfully';
      results.create.data = {
        id: testAccount.id,
        provider: testAccount.provider,
        providerAccountId: testAccount.providerAccountId
      };
      
      
    } catch (error: any) {
      results.create.message = `Create failed: ${error.message}`;
      
    }

    // Test 4: Delete the test record
    if (createdAccountId) {
      
      try {
        // Delete the account
        await prisma.account.delete({
          where: { id: createdAccountId }
        });
        
        // Also delete the test user
        await prisma.user.delete({
          where: { email: testEmail }
        });
        
        results.delete.success = true;
        results.delete.message = 'Test account deleted successfully';
        
      } catch (error: any) {
        results.delete.message = `Delete failed: ${error.message}`;
        
      }
    } else {
      results.delete.message = 'No test record to delete (create failed)';
    }

  } catch (error: any) {
    
    return NextResponse.json({
      error: 'Database check failed',
      message: error.message,
      results
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
    
    
  }

  // Determine overall status
  const allSuccess = Object.values(results).every(r => 
    r.success === true || r.success === undefined
  );

  return NextResponse.json({
    success: allSuccess,
    message: allSuccess ? 'All database operations successful' : 'Some operations failed',
    results,
    timestamp: new Date().toISOString()
  }, { 
    status: allSuccess ? 200 : 500 
  });
}