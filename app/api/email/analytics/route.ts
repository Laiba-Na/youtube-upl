import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import emailjs from "emailjs-com";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.email) {
    console.error(
      "No session or user ID/email found in POST /api/email/analytics"
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$connect();

    // Fetch user settings to check analyticsEmails
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { analyticsEmails: true, email: true },
    });

    if (!user) {
      console.error("User not found:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.analyticsEmails) {
      console.log("Analytics emails disabled for user:", session.user.email);
      return NextResponse.json(
        { message: "Analytics emails disabled" },
        { status: 200 }
      );
    }

    // Fetch user's posts from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const posts = await prisma.socialPost.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: oneWeekAgo },
      },
      select: {
        platform: true,
        scheduledAt: true,
        content: true,
      },
    });

    // Generate analytics summary
    const platformCounts = posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const totalPosts = posts.length;

    const analyticsSummary = {
      to_email: session.user.email,
      total_posts: totalPosts.toString(),
      platforms: Object.entries(platformCounts)
        .map(([platform, count]) => `${platform}: ${count}`)
        .join(", "),
      period: `From ${oneWeekAgo.toLocaleDateString("en-US", {
        timeZone: "Asia/Karachi",
      })} to ${new Date().toLocaleDateString("en-US", {
        timeZone: "Asia/Karachi",
      })}`,
    };

    // Send email using EmailJS
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_ANALYTICS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error("EmailJS configuration missing:", {
        serviceId,
        templateId,
        publicKey,
      });
      throw new Error("EmailJS configuration is missing.");
    }

    await emailjs.send(serviceId, templateId, analyticsSummary, publicKey);
    console.log(
      "Analytics email sent successfully to:",
      session.user.email,
      analyticsSummary
    );

    return NextResponse.json(
      { message: "Analytics email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending analytics email:", error);
    return NextResponse.json(
      {
        error: "Failed to send analytics email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
