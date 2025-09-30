import { notFound } from 'next/navigation';
import ClientReportEnhanced from '@/components/report/ClientReportEnhanced';
import { prisma } from '@/lib/db/prisma';

interface ClientReportPageProps {
  params: {
    slug: string;
  };
}

export default async function ClientReportPage({ params }: ClientReportPageProps) {
  // Get report by shareableId (slug)
  let report = await prisma.clientReport.findUnique({
    where: {
      shareableId: params.slug,
    },
  });

  // Fallback to ID if not found by shareableId
  if (!report) {
    report = await prisma.clientReport.findUnique({
      where: {
        id: params.slug,
      },
    });
  }

  if (!report) {
    notFound();
  }

  return <ClientReportEnhanced report={report} />;
}