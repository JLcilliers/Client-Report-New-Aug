import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// PUT update competitor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    console.log('[Competitor Update API] Updating competitor:', id, 'for report:', slug);

    const body = await request.json();
    const { name, domain, notes } = body;
    console.log('[Competitor Update API] Request body:', { name, domain, notes });
    
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
    
    // Find competitor and verify it belongs to this report
    const existingCompetitor = await prisma.competitor.findUnique({
      where: { id }
    });
    
    if (!existingCompetitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }
    
    if (existingCompetitor.clientReportId !== report.id) {
      return NextResponse.json({ error: 'Competitor does not belong to this report' }, { status: 403 });
    }
    
    // Validate domain format (use same logic as POST endpoint)
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    if (!domainRegex.test(cleanDomain) && cleanDomain.length > 0) {
      return NextResponse.json(
        { error: 'Invalid domain format. Please enter a valid domain like example.com' },
        { status: 400 }
      );
    }
    
    // Check if another competitor with this domain exists for this report
    const duplicateCompetitor = await prisma.competitor.findFirst({
      where: {
        clientReportId: report.id,
        domain: cleanDomain.toLowerCase(),
        id: { not: id }
      }
    });
    
    if (duplicateCompetitor) {
      return NextResponse.json(
        { error: 'Another competitor with this domain already exists for this brand' },
        { status: 409 }
      );
    }
    
    // Update competitor
    const updatedCompetitor = await prisma.competitor.update({
      where: { id },
      data: {
        name: name.trim(),
        domain: cleanDomain.toLowerCase().trim(),
        notes: notes?.trim() || null
      }
    });
    
    return NextResponse.json(updatedCompetitor);
  } catch (error: any) {
    console.error('Failed to update competitor:', error);
    return NextResponse.json(
      { error: 'Failed to update competitor', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE competitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const prisma = getPrisma();
    
    // Find report by slug
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Find competitor and verify it belongs to this report
    const existingCompetitor = await prisma.competitor.findUnique({
      where: { id }
    });
    
    if (!existingCompetitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }
    
    if (existingCompetitor.clientReportId !== report.id) {
      return NextResponse.json({ error: 'Competitor does not belong to this report' }, { status: 403 });
    }
    
    // Delete competitor
    await prisma.competitor.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Competitor deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete competitor:', error);
    return NextResponse.json(
      { error: 'Failed to delete competitor', details: error.message },
      { status: 500 }
    );
  }
}