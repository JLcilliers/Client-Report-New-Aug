import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReport() {
  const reports = await prisma.clientReport.findMany({
    select: {
      id: true,
      shareableId: true,
      reportName: true,
      clientName: true
    }
  });

  console.log(JSON.stringify(reports, null, 2));
  await prisma.$disconnect();
}

checkReport();
