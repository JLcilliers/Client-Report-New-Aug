import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('\n========== Database Check START ==========');
  
  const results = {
    queryAll: { success: false, message: '', data: null as any },
    create: { success: false, message: '', data: null as any },
    delete: { success: false, message: '' },
    prismaStatus: { connected: false, message: '' }
  };

  try {
    // Test 1: Check Prisma connection
    console.log('[DB Check] Testing Prisma connection...');
    try {
      await prisma.$connect();
      results.prismaStatus.connected = true;
      results.prismaStatus.message = 'Prisma connected successfully';
      console.log('[DB Check] ✓ Prisma connected');
    } catch (error: any) {
      results.prismaStatus.message = `Connection failed: ${error.message}`;
      console.error('[DB Check] ✗ Prisma connection failed:', error);
    }

    // Test 2: Query all Account records
    console.log('[DB Check] Querying all Account records...');
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
      
      console.log(`[DB Check] ✓ Query successful: ${accounts.length} accounts found`);
      accounts.forEach((acc, index) => {
        console.log(`  ${index + 1}. ${acc.providerAccountId} (${acc.provider})`);
      });
    } catch (error: any) {
      results.queryAll.message = `Query failed: ${error.message}`;
      console.error('[DB Check] ✗ Query failed:', error);
    }

    // Test 3: Create a test Account record
    console.log('[DB Check] Creating test Account record...');
    const testEmail = `test-${Date.now()}@example.com`;
    let createdAccountId: string | null = null;
    
    try {
      // First create a test user
      console.log('[DB Check] Creating test user...');
      const testUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User'
        }
      });
      console.log('[DB Check] Test user created:', testUser.id);

      // Then create the account
      console.log('[DB Check] Creating test account...');
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
      
      console.log('[DB Check] ✓ Create successful:', testAccount.id);
    } catch (error: any) {
      results.create.message = `Create failed: ${error.message}`;
      console.error('[DB Check] ✗ Create failed:', error);
      console.error('[DB Check] Error details:', JSON.stringify(error, null, 2));
    }

    // Test 4: Delete the test record
    if (createdAccountId) {
      console.log('[DB Check] Deleting test Account record...');
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
        console.log('[DB Check] ✓ Delete successful');
      } catch (error: any) {
        results.delete.message = `Delete failed: ${error.message}`;
        console.error('[DB Check] ✗ Delete failed:', error);
      }
    } else {
      results.delete.message = 'No test record to delete (create failed)';
      console.log('[DB Check] ⚠ Skipping delete (no record created)');
    }

  } catch (error: any) {
    console.error('[DB Check] Unexpected error:', error);
    return NextResponse.json({
      error: 'Database check failed',
      message: error.message,
      results
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
    console.log('[DB Check] Prisma disconnected');
    console.log('========== Database Check END ==========\n');
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