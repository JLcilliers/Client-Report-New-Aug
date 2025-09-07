import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET single action plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; planId: string }> }
) {
  try {
    const { slug, planId } = await params;
    const prisma = getPrisma();
    
    // Find report by slug
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Get action plan
    const actionPlan = await prisma.actionPlan.findFirst({
      where: {
        id: planId,
        reportId: report.id
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!actionPlan) {
      return NextResponse.json({ error: 'Action plan not found' }, { status: 404 });
    }
    
    return NextResponse.json(actionPlan);
  } catch (error: any) {
    console.error('Failed to fetch action plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action plan', details: error.message },
      { status: 500 }
    );
  }
}

// PUT update action plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; planId: string }> }
) {
  try {
    const { slug, planId } = await params;
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
    
    // Update action plan
    const actionPlan = await prisma.actionPlan.update({
      where: {
        id: planId
      },
      data: {
        ...actionPlanData,
        // Mark as completed if status is completed
        completedAt: actionPlanData.status === 'completed' ? new Date() : null
      }
    });
    
    // Delete existing tasks and recreate them
    await prisma.actionPlanTask.deleteMany({
      where: { actionPlanId: planId }
    });
    
    // Create new tasks
    if (tasks && tasks.length > 0) {
      await prisma.actionPlanTask.createMany({
        data: tasks.map((task: any, index: number) => ({
          actionPlanId: planId,
          title: task.title,
          description: task.description,
          isCompleted: task.isCompleted || false,
          completedAt: task.isCompleted ? new Date() : null,
          order: task.order || index
        }))
      });
    }
    
    // Fetch and return updated action plan with tasks
    const updatedActionPlan = await prisma.actionPlan.findUnique({
      where: { id: planId },
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    return NextResponse.json(updatedActionPlan);
  } catch (error: any) {
    console.error('Failed to update action plan:', error);
    return NextResponse.json(
      { error: 'Failed to update action plan', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE action plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; planId: string }> }
) {
  try {
    const { slug, planId } = await params;
    const prisma = getPrisma();
    
    // Find report by slug
    const report = await prisma.clientReport.findUnique({
      where: { shareableId: slug }
    });
    
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Delete action plan (tasks will be cascade deleted)
    await prisma.actionPlan.delete({
      where: {
        id: planId
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete action plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete action plan', details: error.message },
      { status: 500 }
    );
  }
}