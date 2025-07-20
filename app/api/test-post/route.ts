import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { notifyUser } from "@/lib/notify";
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await getServerSession(); // Get session (adjust based on your auth setup)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.socialPost.create({
      data: {
        postTitle: "Test Post", // Added required field
        content: "This is a test post",
        mediaUrl: "path/to/test.mp4",
        platform: "YOUTUBE",
        scheduledAt: new Date(Date.now() + 60 * 1000),
        status: "SCHEDULED",
        userId: session.user.id,
        projectId: null,
      },
    });

    // Send confirmation email
    const emailSent = await notifyUser(
      session.user.email || "fifa12@gmail.com",
      "Post Scheduled",
      `Your post "${
        post.postTitle
      }" has been scheduled for YouTube at ${post.scheduledAt.toISOString()}.`
    );
    console.log(
      `Schedule confirmation email sent to ${session.user.email}: ${emailSent}`
    );

    return NextResponse.json({ success: true, post });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Test post error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
