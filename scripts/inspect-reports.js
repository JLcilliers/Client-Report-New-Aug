import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function inspectReports() {
  try {
    console.log('Fetching all reports...\n')

    const reports = await prisma.clientReport.findMany({
      select: {
        id: true,
        clientName: true,
        reportName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`Total reports: ${reports.length}\n`)

    // Identify reports that likely have client IDs instead of names
    // Client IDs typically look like: clm..., cln..., or similar patterns
    const reportsWithIds = reports.filter(report =>
      report.clientName && (
        report.clientName.startsWith('cl') && report.clientName.length < 30 ||
        report.clientName.match(/^[a-z0-9]{8,}$/i)
      )
    )

    console.log('Reports with potential client IDs in clientName field:')
    console.log('='.repeat(80))
    reportsWithIds.forEach(report => {
      console.log(`ID: ${report.id}`)
      console.log(`ClientName: ${report.clientName}`)
      console.log(`ReportName: ${report.reportName}`)
      console.log(`Created: ${report.createdAt}`)
      console.log('-'.repeat(80))
    })

    console.log(`\nSummary: ${reportsWithIds.length} reports need updating`)

    // Also show reports that look correct
    const reportsWithNames = reports.filter(report =>
      report.clientName && !(
        report.clientName.startsWith('cl') && report.clientName.length < 30 ||
        report.clientName.match(/^[a-z0-9]{8,}$/i)
      )
    )

    console.log('\n\nReports with proper client names:')
    console.log('='.repeat(80))
    reportsWithNames.forEach(report => {
      console.log(`ClientName: ${report.clientName} | Report: ${report.reportName}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

inspectReports()
