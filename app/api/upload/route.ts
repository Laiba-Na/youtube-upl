// api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { UTApi } from 'uploadthing/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const utapi = new UTApi();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        user: { email: session.user.email }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Convert File to UploadThing compatible format
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload file using UploadThing
    const uploadResponse = await utapi.uploadFiles(
      new File([buffer], file.name, { type: file.type })
    );
    
    if (!uploadResponse.data?.ufsUrl) {
      console.error('UploadThing error:', uploadResponse.error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Create asset record
    const assetRecord = await prisma.asset.create({
      data: {
        name: file.name,
        type: file.type.split('/')[0],
        path: uploadResponse.data.ufsUrl,
        projectId: projectId,
      },
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      asset: assetRecord,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}