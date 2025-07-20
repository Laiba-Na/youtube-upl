import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ensure this path works (try '../../lib/prisma' if needed)

export async function GET() {
  try {
    const userAnalytics = await prisma.userAnalytics.findMany();
    return NextResponse.json(userAnalytics);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch user analytics" },
      { status: 500 }
    );
  }
}
