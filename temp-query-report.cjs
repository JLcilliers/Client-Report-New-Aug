const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findReport() {
  try {
    const report = await prisma.clientReport.findFirst({
      select: {
        id: true,
        shareableId: true,
        clientName: true
      }
    });
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

findReport();
