// app/api/assets/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    interface CloudinaryResponse {
      secure_url: string;
    }

    let uploadResult: CloudinaryResponse;

    if (file instanceof File) {
      // Handle File object (from posts/add/page.tsx)
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadResult = await new Promise<CloudinaryResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'thumbnails', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryResponse);
          }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });
    } else if (typeof file === 'string' && file.startsWith('data:image')) {
      // Handle data URL string (from editor)
      uploadResult = await cloudinary.uploader.upload(file, {
        folder: 'thumbnails',
      });
    } else {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset to Cloudinary', details: (error as Error).message },
      { status: 500 }
    );
  }
}