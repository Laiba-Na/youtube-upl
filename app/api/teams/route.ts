// app/api/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new team
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const data = await req.json();
  const { name, description } = data;
  
  try {
    const team = await prisma.team.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: Role.ADMIN
          }
        }
      }
    });
    
    // Update user type
    await prisma.user.update({
      where: { id: session.user.id },
      data: { userType: "TEAM_MEMBER" }
    });
    
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}

// Get all teams for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const teamMemberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: true
      }
    });
    
    return NextResponse.json(teamMemberships);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}