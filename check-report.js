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

  );
  await prisma.$disconnect();
}

checkReport();
