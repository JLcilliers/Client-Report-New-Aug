const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    
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
    
    accounts.forEach(acc => {
      
      
      
      
      .toISOString() : 'None'}`);
      / 1000)) : 'Unknown'}`);
      
    });

    
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
    
    googleTokens.forEach(token => {
      
      
      
      
      
      * 1000).toISOString() : 'None'}`);
      
    });

  } catch (error) {
    
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();