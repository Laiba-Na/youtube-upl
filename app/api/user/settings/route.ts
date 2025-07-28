import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error("No session or user ID found in GET /api/user/settings");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$connect();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        emailNotifications: true,
        analyticsEmails: true,
        timezone: true,
        profileImage: true,
        darkMode: true,
      },
    });

    if (!user) {
      console.error("User not found:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Returning user settings:", user);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error("No session or user ID found in PUT /api/user/settings");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$connect();
    const {
      name,
      email,
      emailNotifications,
      analyticsEmails,
      timezone,
      profileImage,
      darkMode,
    } = await request.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (emailNotifications !== undefined)
      updateData.emailNotifications = emailNotifications;
    if (analyticsEmails !== undefined)
      updateData.analyticsEmails = analyticsEmails;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (darkMode !== undefined) updateData.darkMode = darkMode;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        emailNotifications: true,
        analyticsEmails: true,
        timezone: true,
        profileImage: true,
        darkMode: true,
      },
    });

    console.log("User settings updated:", user);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}