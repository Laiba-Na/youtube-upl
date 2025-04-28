// app/api/projects/[projectId]/assets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }  from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client';
import cloudinary from '@/lib/cloudinary'
import streamifier from 'streamifier'

const prisma = new PrismaClient();


export const config = { api: { bodyParser: false } }

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // 1) Authenticate
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2) Verify project ownership
  const project = await prisma.project.findUnique({ where: { id: params.projectId } })
  if (!project || project.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3) Parse the uploaded file
  const form  = await req.formData()
  const file  = form.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())

  // 4) Upload to Cloudinary via upload_stream
  let result: any
  try {
    result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `projects/${params.projectId}`,      // namespacing
          resource_type: 'image',
        },
        (error, uploaded) => {
          if (error) reject(error)
          else resolve(uploaded)
        }
      )
      streamifier.createReadStream(buffer).pipe(uploadStream)
    })
  } catch (err) {
    console.error('Cloudinary upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // 5) Persist metadata in MySQL via Prisma
  const asset = await prisma.asset.create({
    data: {
      projectId: params.projectId,
      url:       result.secure_url,
      key:       result.public_id,
      filename:  file.name,
      mimeType:  file.type,
      size:      file.size,
    }
  })

  return NextResponse.json(asset)
}
