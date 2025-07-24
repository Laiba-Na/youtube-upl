import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await prisma.facebookAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true, pageName: true },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching Facebook accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await request.json();
  if (!accountId) {
    return NextResponse.json({ error: "Account ID required" }, { status: 400 });
  }

  try {
    await prisma.facebookAccount.delete({
      where: { id: accountId, userId: session.user.id },
    });
    return NextResponse.json({ message: "Account disconnected" });
  } catch (error) {
    console.error("Error disconnecting Facebook account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
