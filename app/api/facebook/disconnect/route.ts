import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { facebookAccountId } = body;
    
    if (!facebookAccountId) {
      return NextResponse.json(
        { message: "Facebook account ID is required" },
        { status: 400 }
      );
    }
    
    // Find the Facebook account
    const facebookAccount = await prisma.facebookAccount.findUnique({
      where: { id: facebookAccountId },
    });
    
    if (!facebookAccount) {
      return NextResponse.json(
        { message: "Facebook account not found" },
        { status: 404 }
      );
    }
    
    // Check if this Facebook account belongs to the authenticated user
    if (facebookAccount.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized: Account does not belong to user" },
        { status: 403 }
      );
    }
    
    // Delete the Facebook account
    await prisma.facebookAccount.delete({
      where: { id: facebookAccountId },
    });
    
    return NextResponse.json({
      success: true,
      message: "Facebook account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Facebook account:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}