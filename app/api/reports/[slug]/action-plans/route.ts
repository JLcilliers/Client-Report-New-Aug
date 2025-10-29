import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET all action plans for a report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const prisma = getPrisma();
    
    // Find report by slug (shareableId)
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Get all action plans for this report
    const actionPlans = await prisma.actionPlan.findMany({
      where: { reportId: report.id },
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { priority: 'asc' }
    });
    
    return NextResponse.json(actionPlans);
  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to fetch action plans', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new action plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const prisma = getPrisma();
    
    // Find report by slug
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Extract tasks from body
    const { tasks, ...actionPlanData } = body;
    
    // Create action plan with tasks
    const actionPlan = await prisma.actionPlan.create({
      data: {
        ...actionPlanData,
        reportId: report.id,
        tasks: {
          create: tasks?.map((task: any, index: number) => ({
            title: task.title,
            description: task.description,
            isCompleted: task.isCompleted || false,
            order: task.order || index
          }))
        }
      },
      include: {
        tasks: true
      }
    });
    
    return NextResponse.json(actionPlan);
  } catch (error: any) {
    
    return NextResponse.json(
      { error: 'Failed to create action plan', details: error.message },
      { status: 500 }
    );
  }
}