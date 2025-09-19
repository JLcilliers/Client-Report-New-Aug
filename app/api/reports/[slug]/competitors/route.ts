import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET all competitors for a report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const prisma = getPrisma();
    
    // Find report by slug (shareableId)
    let report = await prisma.clientReport.findUnique({
      where: { shareableId: slug },
      include: {
        competitors: {
          orderBy: { addedAt: 'desc' }
        }
      }
    });

    // Try finding by ID as fallback
    if (!report) {
      report = await prisma.clientReport.findUnique({
        where: { id: slug },
        include: {
          competitors: {
            orderBy: { addedAt: 'desc' }
          }
        }
      });
    }

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      competitors: report.competitors,
      brandName: report.clientName
    });
  } catch (error: any) {
    console.error('Failed to fetch competitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new competitor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log('[Competitor API] Creating competitor for report:', slug);

    const body = await request.json();
    const { name, domain, notes } = body;
    console.log('[Competitor API] Request body:', { name, domain, notes });

    if (!name || !domain) {
      console.error('[Competitor API] Missing required fields');
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Find report by slug
    console.log('[Competitor API] Finding report with shareableId:', slug);
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    });

    let finalReport = report;
    if (!report) {
      console.log('[Competitor API] Report not found by shareableId, trying by ID:', slug);
      // Try finding by ID as fallback
      const reportById = await prisma.clientReport.findUnique({
        where: { id: slug }
      });
      if (!reportById) {
        console.error('[Competitor API] Report not found by either shareableId or ID:', slug);
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      // Use the report found by ID
      console.log('[Competitor API] Found report by ID instead:', reportById.id);
      finalReport = reportById;
    } else {
      console.log('[Competitor API] Found report by shareableId:', report.id);
    }

    // Validate domain format (allow common domain patterns)
    // Allow domains like: example.com, sub.example.com, example.co.uk, etc.
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    console.log('[Competitor API] Original domain:', domain, 'Clean domain:', cleanDomain);

    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    if (!domainRegex.test(cleanDomain) && cleanDomain.length > 0) {
      console.error('[Competitor API] Invalid domain format:', domain, 'Clean:', cleanDomain);
      return NextResponse.json(
        { error: 'Invalid domain format. Please enter a valid domain like example.com' },
        { status: 400 }
      );
    }

    // TypeScript guard - at this point finalReport is definitely not null
    if (!finalReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if competitor with this domain already exists for this report
    console.log('[Competitor API] Checking for existing competitor with domain:', cleanDomain.toLowerCase());
    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        clientReportId: finalReport.id,
        domain: cleanDomain.toLowerCase()
      }
    });

    if (existingCompetitor) {
      console.log('[Competitor API] Competitor with domain already exists:', existingCompetitor.id);
      return NextResponse.json(
        { error: 'A competitor with this domain already exists for this brand' },
        { status: 409 }
      );
    }

    console.log('[Competitor API] Creating competitor for report ID:', finalReport.id);
    // Create competitor
    const competitor = await prisma.competitor.create({
      data: {
        clientReportId: finalReport.id,
        name: name.trim(),
        domain: cleanDomain.toLowerCase().trim(),
        notes: notes?.trim() || null,
        addedAt: new Date()
      }
    });

    console.log('[Competitor API] Competitor created successfully:', competitor.id);
    
    return NextResponse.json(competitor, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create competitor:', error);
    return NextResponse.json(
      { error: 'Failed to create competitor', details: error.message },
      { status: 500 }
    );
  }
}