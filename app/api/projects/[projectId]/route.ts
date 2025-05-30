import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Get a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: { Asset: true }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    if (!user || project.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// Update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, description, content: contentString } = await req.json();
    const contentObj = JSON.parse(contentString);
  const thumbnail = contentObj.thumbnail || null;
  delete contentObj.thumbnail;
    
    const project = await prisma.project.findUnique({
      where: { id: params.projectId }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    if (!user || project.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updatedProject = await prisma.project.update({
      where: { id: params.projectId },
      data: {
        name: name !== undefined ? name : project.name,
        description: description !== undefined ? description : project.description,
        content: contentObj !== undefined ? contentObj : project.content,
        thumbnail: thumbnail !== undefined ? thumbnail : project.thumbnail,
      }
    });
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const project = await prisma.project.findUnique({
      where: { id: params.projectId }
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });
    
    if (!user || project.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete associated assets first
    await prisma.asset.deleteMany({
      where: { projectId: params.projectId }
    });
    
    // Delete the project
    await prisma.project.delete({
      where: { id: params.projectId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
