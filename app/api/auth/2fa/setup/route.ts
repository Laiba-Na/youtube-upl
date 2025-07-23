//2fa/setup/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate a new 2FA secret
    const secret = speakeasy.generateSecret({
      name: `MyApp:${session.user.email}`,
      issuer: 'MyApp',
    });

    // Generate QR code URL
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Save the secret to the user's record (not enabling 2FA yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret.base32 },
    });

    return NextResponse.json({
      qrCodeUrl,
      secret: secret.base32,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}