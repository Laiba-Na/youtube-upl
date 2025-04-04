// Updated google/accounts/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  console.log("GET /api/google/accounts - Start");
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user?.id);
    
    if (!session?.user?.id) {
      console.log("Unauthorized - No user ID in session");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch the user's connected Google accounts, make sure to fetch ALL accounts
    console.log("Fetching Google accounts for user ID:", session.user.id);
    const googleAccounts = await prisma.googleAccount.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        googleEmail: true,
        provider: true,
        providerAccountId: true,
        createdAt: true
      }
    });

    console.log(`Found ${googleAccounts.length} Google accounts for user`);
    googleAccounts.forEach(acc => {
      console.log(`- Account ID: ${acc.id}, Email: ${acc.googleEmail}`);
    });

    // For debugging: check for potential duplicate users
    const allUsers = await prisma.user.findMany({
      where: {
        email: {
          in: googleAccounts.map(acc => acc.googleEmail)
        }
      },
      select: {
        id: true,
        email: true
      }
    });
    
    console.log(`Users with Google account emails: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`- User ID: ${user.id}, Email: ${user.email}`);
    });

    return NextResponse.json({
      accounts: googleAccounts,
      _debug: {
        userCount: allUsers.length,
        accountCount: googleAccounts.length,
        userId: session.user.id
      }
    });
  } catch (error: any) {
    console.error('Error fetching Google accounts:', error);
    return new NextResponse(
      `Error fetching Google accounts: ${error.message || 'Unknown error'}`,
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}