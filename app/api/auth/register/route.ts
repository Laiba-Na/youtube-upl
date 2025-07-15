import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Regular expressions for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input fields
    if (!name || !email || !password) {
      return new NextResponse(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate name (at least 2 characters, no special characters)
    if (name.length < 2 || !/^[a-zA-Z\s]+$/.test(name)) {
      return new NextResponse(
        JSON.stringify({ error: 'Name must be at least 2 characters long and contain only letters and spaces' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate password (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character)
    if (!passwordRegex.test(password)) {
      return new NextResponse(
        JSON.stringify({
          error:
            'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await prisma.$disconnect();
  }
}