import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const posts = await prisma.socialPost.findMany({
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json({ success: true, posts });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Fetch posts error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received POST data:", body);
    const { content, platform, scheduledAt, mediaUrl, userId } = body;

    if (!content || !platform || !scheduledAt) {
      throw new Error(
        "Missing required fields: content, platform, or scheduledAt"
      );
    }

    const defaultUserId = "decfddf6-9eb9-4336-8f31-97df789e662a"; // Updated to new userId
    const effectiveUserId = userId || defaultUserId;

    const post = await prisma.socialPost.create({
      data: {
        content: content,
        platform: platform,
        scheduledAt: new Date(scheduledAt),
        mediaUrl: mediaUrl || null,
        userId: effectiveUserId,
        status: "SCHEDULED",
        projectId: null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Create post error:", error, errorMessage);
    return NextResponse.json(
      { error: `Failed to create post: ${errorMessage}` },
      { status: 500 }
    );
  }
}
