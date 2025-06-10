// app/api/facebook/connect-page/route.ts
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
    const { pageId, pageName, pageAccessToken, userId, facebookAccountId } = body;
    
    if (!pageId || !pageName || !pageAccessToken || !userId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if this is the authenticated user
    if (session.user.id !== userId) {
      return NextResponse.json(
        { message: "Unauthorized: User ID mismatch" },
        { status: 403 }
      );
    }
    
    // Update the Facebook account with page information
    await prisma.facebookAccount.update({
      where: { id: facebookAccountId },
      data: {
        pageId,
        pageName,
        // Store the page access token in the access token field
        // This is safe because we're now using the page-specific token
        accessToken: pageAccessToken,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Facebook page connected successfully",
    });
  } catch (error) {
    console.error("Error connecting Facebook page:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}