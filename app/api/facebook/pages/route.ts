// app/api/facebook/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get access token from query params
    const accessToken = request.nextUrl.searchParams.get("accessToken");
    
    if (!accessToken) {
      return NextResponse.json(
        { message: "Access token is required" },
        { status: 400 }
      );
    }
    
    // Fetch user's Facebook pages
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=name,access_token,id&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error("Facebook API error:", error);
      return NextResponse.json(
        { message: `Error from Facebook API: ${error.error?.message || "Unknown error"}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      pages: data.data,
    });
  } catch (error) {
    console.error("Error fetching Facebook pages:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}