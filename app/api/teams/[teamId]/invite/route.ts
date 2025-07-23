import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { teamId } = params;
  const { email, role, password } = await req.json();
  
  try {
    // Check if the current user is an admin of this team
    const isAdmin = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: Role.ADMIN
      }
    });
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Only team admins can invite members" }, { status: 403 });
    }
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    // If user doesn't exist, create a new user with the provided password
    if (!user) {
      if (!password) {
        return NextResponse.json({ error: "Password is required for new users" }, { status: 400 });
      }
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          password: await bcrypt.hash(password, 12),
          userType: "TEAM_MEMBER"
        }
      });
      
      // TODO: Send invitation email with the provided password
    }
    
    // Add user to the team
    const teamMember = await prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId,
        role: role as Role
      }
    });
    
    return NextResponse.json(teamMember);
  } catch (error) {
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}