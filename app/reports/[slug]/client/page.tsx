import { notFound } from 'next/navigation';
import ClientReportView from '@/components/report/ClientReportView';
import { prisma } from '@/lib/db';

interface ClientReportPageProps {
  params: {
    slug: string;
  };
}

export default async function ClientReportPage({ params }: ClientReportPageProps) {
  const report = await prisma.clientReport.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      gaProperty: true,
      gscProperty: true,
    },
  });

  if (!report) {
    notFound();
  }

  return <ClientReportView report={report} />;
}