import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$transaction([
      prisma.socialPost.deleteMany({ where: { userId: session.user.id } }),
      prisma.googleAccount.deleteMany({ where: { userId: session.user.id } }),
      prisma.facebookAccount.deleteMany({ where: { userId: session.user.id } }),
      prisma.teamMember.deleteMany({ where: { userId: session.user.id } }),
      prisma.post.deleteMany({ where: { userId: session.user.id } }),
      prisma.project.deleteMany({ where: { userId: session.user.id } }),
      prisma.user.delete({ where: { id: session.user.id } }),
    ]);
    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
