import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error("No session or user ID found in GET /api/calendar/posts");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$connect();
    const posts = await prisma.socialPost.findMany({
      where: { userId: session.user.id },
      include: { user: true },
    });
    console.log("Returning posts:", posts);
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error("No session or user ID found in POST /api/calendar/posts");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$connect();
    const { content, platform, scheduledAt, mediaUrl, userId } =
      await request.json();

    console.log("POST /api/calendar/posts received data:", {
      content,
      platform,
      scheduledAt,
      mediaUrl,
      userId,
    });

    if (!content || !userId || !scheduledAt || !platform) {
      console.error("Validation failed: Missing required fields");
      return NextResponse.json(
        {
          error:
            "Missing required fields: content, userId, scheduledAt, and platform are required",
        },
        { status: 400 }
      );
    }

    if (userId !== session.user.id) {
      console.error("Validation failed: Invalid user ID", {
        userId,
        sessionUserId: session.user.id,
      });
      return NextResponse.json({ error: "Invalid user ID" }, { status: 403 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      console.error("Validation failed: Invalid scheduledAt date format", {
        scheduledAt,
      });
      return NextResponse.json(
        { error: "Invalid scheduledAt date format" },
        { status: 400 }
      );
    }

    const post = await prisma.socialPost.create({
      data: {
        content,
        platform,
        scheduledAt: scheduledDate,
        mediaUrl: mediaUrl || null,
        userId,
        status: "SCHEDULED",
        projectId: null,
      },
    });

    console.log("Post created successfully:", post);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      {
        error: `Failed to create post: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}