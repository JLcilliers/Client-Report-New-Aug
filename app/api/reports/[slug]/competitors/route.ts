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
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug },
      include: {
        competitors: {
          orderBy: { addedAt: 'desc' }
        }
      }
    });
    
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
    const body = await request.json();
    const { name, domain, notes } = body;
    
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }
    
    const prisma = getPrisma();
    
    // Find report by slug
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }
    
    // Check if competitor with this domain already exists for this report
    const existingCompetitor = await prisma.competitor.findFirst({
      where: {
        clientReportId: report.id,
        domain: domain.toLowerCase()
      }
    });
    
    if (existingCompetitor) {
      return NextResponse.json(
        { error: 'A competitor with this domain already exists for this brand' },
        { status: 409 }
      );
    }
    
    // Create competitor
    const competitor = await prisma.competitor.create({
      data: {
        clientReportId: report.id,
        name: name.trim(),
        domain: domain.toLowerCase().trim(),
        notes: notes?.trim() || null
      }
    });
    
    return NextResponse.json(competitor, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create competitor:', error);
    return NextResponse.json(
      { error: 'Failed to create competitor', details: error.message },
      { status: 500 }
    );
  }
}