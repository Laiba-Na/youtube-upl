// Updated google/accounts/[accountId]/route.ts with session refresh
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { getToken, encode } from 'next-auth/jwt';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  console.log(`DELETE request for account ID: ${params.accountId}`);
  try {
    const { accountId } = params;
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("Unauthorized - No user ID in session");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find the Google account with its details before deletion
    const accountToDelete = await prisma.googleAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        userId: true,
        googleEmail: true,
        providerAccountId: true
      }
    });

    if (!accountToDelete) {
      console.log("Account not found");
      return new NextResponse('Account not found', { status: 404 });
    }

    if (accountToDelete.userId !== session.user.id) {
      console.log("Forbidden - Account doesn't belong to current user");
      return new NextResponse('Forbidden', { status: 403 });
    }

    console.log(`Deleting Google account: ${accountToDelete.googleEmail}`);
    
    // Use a transaction to handle related operations
    await prisma.$transaction(async (tx) => {
      // 1. Delete the Google account entry
      await tx.googleAccount.delete({
        where: { id: accountId }
      });
      
      // 2. Check if we need to delete a duplicate user entry
      // IMPORTANT: Only if this is NOT the primary user account
      if (accountToDelete.googleEmail !== session.user.email) {
        const possibleDuplicateUser = await tx.user.findFirst({
          where: { 
            email: accountToDelete.googleEmail,
            // Make sure we're not deleting the main user account!
            NOT: { id: session.user.id }
          }
        });
        
        if (possibleDuplicateUser) {
          console.log(`Found duplicate user entry for ${accountToDelete.googleEmail}, deleting...`);
          await tx.user.delete({
            where: { id: possibleDuplicateUser.id }
          });
        }
      }
    });

    console.log("Account deletion completed successfully");
    
    return NextResponse.json({
      message: 'Google account disconnected successfully',
      deletedAccount: {
        id: accountId,
        email: accountToDelete.googleEmail
      },
      shouldUpdateSession: true
    });
  } catch (error: any) {
    console.error('Error deleting Google account:', error);
    return new NextResponse(
      `Error deleting Google account: ${error.message || 'Unknown error'}`,
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}