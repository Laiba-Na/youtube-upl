// 2fa/verify/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { token } = await request.json();
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.twoFactorSecret) {
      return new NextResponse(
        JSON.stringify({ error: '2FA not set up' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the TOTP token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step before/after for clock skew
    });

    if (!isValid) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid 2FA code' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enable 2FA for the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('2FA verification error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}