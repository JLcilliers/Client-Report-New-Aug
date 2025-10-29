import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get all client reports to check how properties are stored
    const reports = await prisma.clientReport.findMany({
      select: {
        id: true,
        clientName: true,
        reportName: true,
        ga4PropertyId: true,
        searchConsolePropertyId: true,
        googleAccountId: true,
        shareableId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    const analysis = reports.map(report => {
      const ga4Analysis = {
        raw: report.ga4PropertyId,
        isEmpty: !report.ga4PropertyId || report.ga4PropertyId === '',
        hasPropertiesPrefix: report.ga4PropertyId?.startsWith('properties/'),
        expectedFormat: report.ga4PropertyId?.startsWith('properties/') 
          ? report.ga4PropertyId 
          : `properties/${report.ga4PropertyId}`,
        isNumericOnly: /^\d+$/.test(report.ga4PropertyId || '')
      }
      
      const scAnalysis = {
        raw: report.searchConsolePropertyId,
        isEmpty: !report.searchConsolePropertyId || report.searchConsolePropertyId === '',
        isUrl: report.searchConsolePropertyId?.startsWith('http') || report.searchConsolePropertyId?.startsWith('sc-domain:')
      }
      
      return {
        id: report.id,
        clientName: report.clientName,
        reportName: report.reportName,
        shareableId: report.shareableId,
        googleAccountId: report.googleAccountId,
        createdAt: report.createdAt,
        ga4Property: ga4Analysis,
        searchConsoleProperty: scAnalysis
      }
    })
    
    // Check for common issues
    const issues = {
      reportsWithoutGA4: analysis.filter(r => r.ga4Property.isEmpty).length,
      reportsWithoutSC: analysis.filter(r => r.searchConsoleProperty.isEmpty).length,
      ga4WithWrongFormat: analysis.filter(r => !r.ga4Property.isEmpty && !r.ga4Property.hasPropertiesPrefix).length,
      ga4NumericOnly: analysis.filter(r => r.ga4Property.isNumericOnly).length
    }
    
    // Recommendation
    let recommendation = ''
    if (issues.ga4WithWrongFormat > 0) {
      recommendation = `Found ${issues.ga4WithWrongFormat} reports with GA4 properties missing 'properties/' prefix. ` +
        `These are stored as numeric IDs only (e.g., '123456789' instead of 'properties/123456789'). ` +
        `The refresh endpoint correctly adds the prefix when making API calls, so this should work. ` +
        `However, for consistency, consider updating the storage format.`
    } else if (reports.length === 0) {
      recommendation = 'No reports found in the database. Create a report first to test property storage.'
    } else {
      recommendation = 'All GA4 properties are stored in the correct format with the "properties/" prefix.'
    }
    
    return NextResponse.json({
      success: true,
      totalReports: reports.length,
      reports: analysis,
      issues,
      recommendation
    })
    
  } catch (error: any) {
    
    return NextResponse.json({
      error: "Failed to verify property storage",
      details: error.message
    }, { status: 500 })
  }
}