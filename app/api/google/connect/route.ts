// api/google/connect/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Get Google connection details from session
    if (!session.googleConnection) {
      return new NextResponse('No Google connection found', { status: 400 });
    }
    
    const { accessToken, refreshToken, email } = session.googleConnection;
    
    if (!refreshToken || !email) {
      return new NextResponse('Missing required connection data', { status: 400 });
    }
    
    // Check if this Google account is already connected to this user
    const existingAccount = await prisma.googleAccount.findFirst({
      where: {
        googleEmail: email,
        userId: session.user.id
      }
    });
    
    if (existingAccount) {
      // Update the existing connection
      await prisma.googleAccount.update({
        where: { id: existingAccount.id },
        data: {
          refreshToken: refreshToken
        }
      });
      
      return NextResponse.json({
        message: 'Google account connection updated',
        accountId: existingAccount.id
      });
    }
    
    // Create a new connection
    const newGoogleAccount = await prisma.googleAccount.create({
      data: {
        provider: 'google',
        providerAccountId: email, // Using email as a unique identifier
        googleEmail: email,
        refreshToken: refreshToken,
        userId: session.user.id
      }
    });
    
    return NextResponse.json({
      message: 'Google account connected successfully',
      accountId: newGoogleAccount.id
    });
  } catch (error: any) {
    console.error('Error connecting Google account:', error);
    return new NextResponse(`Error connecting Google account: ${error.message || 'Unknown error'}`, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}