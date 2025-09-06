const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== CHECKING ACCOUNT TABLE ===');
    const accounts = await prisma.account.findMany({
      where: { provider: 'google' },
      select: {
        id: true,
        userId: true,
        providerAccountId: true,
        access_token: true,
        refresh_token: true,
        expires_at: true
      }
    });
    console.log(`Found ${accounts.length} Google accounts in Account table:`);
    accounts.forEach(acc => {
      console.log(`- ID: ${acc.id}`);
      console.log(`  Email: ${acc.providerAccountId}`);
      console.log(`  Has Access Token: ${!!acc.access_token}`);
      console.log(`  Has Refresh Token: ${!!acc.refresh_token}`);
      console.log(`  Expires At: ${acc.expires_at ? new Date(acc.expires_at * 1000).toISOString() : 'None'}`);
      console.log(`  Is Expired: ${acc.expires_at ? (acc.expires_at < Math.floor(Date.now() / 1000)) : 'Unknown'}`);
      console.log('');
    });

    console.log('=== CHECKING GOOGLE_TOKENS TABLE ===');
    const googleTokens = await prisma.googleTokens.findMany({
      select: {
        id: true,
        email: true,
        google_sub: true,
        access_token: true,
        refresh_token: true,
        expires_at: true,
        userId: true
      }
    });
    console.log(`Found ${googleTokens.length} entries in GoogleTokens table:`);
    googleTokens.forEach(token => {
      console.log(`- ID: ${token.id}`);
      console.log(`  Email: ${token.email}`);
      console.log(`  Google Sub: ${token.google_sub}`);
      console.log(`  Has Access Token: ${!!token.access_token}`);
      console.log(`  Has Refresh Token: ${!!token.refresh_token}`);
      console.log(`  Expires At: ${token.expires_at ? new Date(Number(token.expires_at) * 1000).toISOString() : 'None'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();