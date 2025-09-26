import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TechnicalSEOAuditService } from '../../../../lib/seo/audit-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const {
      url,
      reportId,
      clientReportId,
      options = {}
    } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('🚀 Starting comprehensive technical SEO audit for:', url);

    // Create audit record in database
    let auditRecord;
    try {
      auditRecord = await prisma.sEOAudit.create({
        data: {
          reportId: reportId || undefined,
          clientReportId: clientReportId || undefined,
          domain: new URL(url).hostname,
          url
        }
      });
      console.log('✅ Created audit record:', auditRecord.id);
    } catch (dbError) {
      console.warn('Failed to create audit record in database:', dbError);
      // Continue without database record for now
      auditRecord = { id: 'temp-id-' + Date.now() };
    }

    // Initialize audit service
    const auditService = new TechnicalSEOAuditService(url);

    // Run comprehensive audit
    const startTime = Date.now();
    const auditResult = await auditService.runComprehensiveAudit();
    const duration = Date.now() - startTime;

    console.log(`✅ Audit completed in ${duration}ms with score: ${auditResult.overallScore}/100 (${auditResult.summary.grade})`);

    // Update audit record with comprehensive results
    if (auditRecord.id && !auditRecord.id.startsWith('temp-id-')) {
      try {
        await prisma.sEOAudit.update({
          where: { id: auditRecord.id },
          data: {
            overallScore: auditResult.overallScore,
            performanceScore: auditResult.categories.coreWebVitals.score,
            seoScore: auditResult.categories.crawlabilityIndexability.score,
            accessibilityScore: auditResult.categories.mobileFirstParity.score,
            securityScore: auditResult.categories.securityHeaders.score,
            mobileScore: auditResult.categories.mobileFirstParity.score,

            // Detailed results storage
            coreWebVitals: JSON.stringify(auditResult.detailedResults.coreWebVitals),
            crawlabilityData: JSON.stringify(auditResult.detailedResults.crawlability),
            metaTagsAnalysis: JSON.stringify({
              canonical: auditResult.detailedResults.canonicalization,
              meta: auditResult.detailedResults.crawlability.metaRobots
            }),
            structuredData: JSON.stringify(auditResult.detailedResults.structuredData),
            securityChecks: JSON.stringify(auditResult.detailedResults.security),
            linkAnalysis: JSON.stringify(auditResult.detailedResults.linkStructure),
            mobileUsability: JSON.stringify(auditResult.detailedResults.mobileIndexing),

            // Technical issues and recommendations
            technicalIssues: JSON.stringify(auditResult.categories),
            recommendations: JSON.stringify(auditResult.recommendations),

            // Additional metadata
            auditDuration: duration,
            auditType: 'comprehensive',
            auditVersion: '2025.1'
          }
        });
        console.log('✅ Updated audit record with comprehensive results');
      } catch (updateError) {
        console.warn('Failed to update audit record:', updateError);
      }
    }

    // Add audit ID to result
    auditResult.auditId = auditRecord.id;

    return NextResponse.json({
      success: true,
      audit: auditResult,
      metadata: {
        auditId: auditRecord.id,
        duration,
        timestamp: new Date().toISOString(),
        version: '2025.1'
      }
    });

  } catch (error) {
    console.error('Comprehensive technical audit error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform comprehensive technical audit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve existing audit results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('auditId');
    const url = searchParams.get('url');
    const latest = searchParams.get('latest') === 'true';

    if (!auditId && !url) {
      return NextResponse.json({ error: 'auditId or url is required' }, { status: 400 });
    }

    let auditRecord;

    if (auditId) {
      // Get specific audit by ID
      auditRecord = await prisma.sEOAudit.findUnique({
        where: { id: auditId }
      });
    } else if (url) {
      // Get latest audit for URL
      const domain = new URL(url).hostname;
      auditRecord = await prisma.sEOAudit.findFirst({
        where: {
          OR: [
            { url: url },
            { domain: domain }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!auditRecord) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Reconstruct audit result from stored data
    const auditResult = {
      auditId: auditRecord.id,
      url: auditRecord.url,
      domain: auditRecord.domain,
      timestamp: auditRecord.createdAt.toISOString(),
      overallScore: auditRecord.overallScore,

      // Parse stored JSON data
      categories: auditRecord.technicalIssues ? JSON.parse(auditRecord.technicalIssues) : null,
      recommendations: auditRecord.recommendations ? JSON.parse(auditRecord.recommendations) : [],

      detailedResults: {
        coreWebVitals: auditRecord.coreWebVitals ? JSON.parse(auditRecord.coreWebVitals) : null,
        crawlability: auditRecord.crawlabilityData ? JSON.parse(auditRecord.crawlabilityData) : null,
        canonicalization: auditRecord.metaTagsAnalysis ? JSON.parse(auditRecord.metaTagsAnalysis)?.canonical : null,
        structuredData: auditRecord.structuredData ? JSON.parse(auditRecord.structuredData) : null,
        security: auditRecord.securityChecks ? JSON.parse(auditRecord.securityChecks) : null,
        linkStructure: auditRecord.linkAnalysis ? JSON.parse(auditRecord.linkAnalysis) : null,
        mobileIndexing: auditRecord.mobileUsability ? JSON.parse(auditRecord.mobileUsability) : null
      },

      metadata: {
        auditDuration: auditRecord.auditDuration,
        auditType: auditRecord.auditType || 'comprehensive',
        auditVersion: auditRecord.auditVersion || '2025.1'
      }
    };

    return NextResponse.json({
      success: true,
      audit: auditResult
    });

  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve audit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to remove audit results
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('auditId');

    if (!auditId) {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 });
    }

    await prisma.sEOAudit.delete({
      where: { id: auditId }
    });

    return NextResponse.json({
      success: true,
      message: 'Audit deleted successfully'
    });

  } catch (error) {
    console.error('Delete audit error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete audit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}