import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map of report IDs to their correct client names
// For the "Lancer Skincare SEO Report", extract client name from report name
const fixes = [
  {
    id: 'c8d7aa99-25b2-4898-8d19-0036d702a970',
    oldClientName: '1757179110436',
    newClientName: 'Lancer Skincare', // Extracted from "Lancer Skincare SEO Report"
    reportName: 'Lancer Skincare SEO Report'
  }
]

async function fixClientNames() {
  try {
    console.log('Starting client name migration...\n')
    console.log(`Found ${fixes.length} report(s) to update\n`)

    let successCount = 0
    let errorCount = 0

    for (const fix of fixes) {
      try {
        console.log(`Updating report: ${fix.reportName}`)
        console.log(`  ID: ${fix.id}`)
        console.log(`  Old clientName: ${fix.oldClientName}`)
        console.log(`  New clientName: ${fix.newClientName}`)

        // Verify the report exists with the old client name
        const report = await prisma.clientReport.findUnique({
          where: { id: fix.id },
          select: { id: true, clientName: true, reportName: true }
        })

        if (!report) {
          console.log(`  ❌ Report not found`)
          errorCount++
          continue
        }

        if (report.clientName !== fix.oldClientName) {
          console.log(`  ⚠️  Current clientName is "${report.clientName}", expected "${fix.oldClientName}"`)
          console.log(`  Skipping this report as it may have been updated already`)
          continue
        }

        // Update the report
        await prisma.clientReport.update({
          where: { id: fix.id },
          data: { clientName: fix.newClientName }
        })

        console.log(`  ✅ Successfully updated`)
        successCount++

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
        errorCount++
      }

      console.log('') // Empty line for readability
    }

    console.log('='.repeat(80))
    console.log(`Migration complete!`)
    console.log(`  Success: ${successCount}`)
    console.log(`  Errors: ${errorCount}`)
    console.log(`  Total: ${fixes.length}`)

  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixClientNames()
